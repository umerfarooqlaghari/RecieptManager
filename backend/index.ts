import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { requireAuth } from './middleware/auth';
import { requirePremium } from './middleware/premium';
import * as awsService from './services/awsService';
import * as geminiService from './services/geminiService';
import * as expenseService from './services/expenseService';
import * as otpService from './services/otpService';
import { getSupabaseClient } from './lib/supabase';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// CORS: native apps often omit Origin. When CORS_ORIGINS is set, restrict browser origins.
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(
  cors(
    corsOrigins.length
      ? { origin: corsOrigins, credentials: true }
      : undefined
  )
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Expensive AI+S3 scan: max 20 requests per hour per IP
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many scan requests. Please wait before scanning again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: max 200 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);

// ─── Helper: map Gemini category string → DB category_id ─────────────────────
async function resolveCategoryId(accessToken: string, categoryName: string | undefined): Promise<string | null> {
  if (!categoryName) return null;
  try {
    const supabase = getSupabaseClient(accessToken);
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .is('user_id', null)   // system-level categories only
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
  res.send('Expense Manager API is running');
});

// Sample protected route
app.get('/protected', requireAuth, (req: Request, res: Response) => {
  res.json({ message: 'You have accessed a protected route!', user: (req as any).user });
});

// ─── Auth OTP (AWS SES) ───────────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/send-otp', otpLimiter, async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim();
    const userId = String(req.body?.userId || '').trim();
    if (!email || !userId) {
      return res.status(400).json({ error: 'email and userId are required' });
    }
    const result = await otpService.sendSignupOtp(email, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[OTP] send failed:', error.message);
    res.status(400).json({ error: error.message || 'Failed to send verification code' });
  }
});

app.post('/api/auth/verify-otp', otpLimiter, async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim();
    const otp = String(req.body?.otp || req.body?.code || '').trim();
    if (!email || !otp) {
      return res.status(400).json({ error: 'email and otp are required' });
    }
    const result = await otpService.verifySignupOtp(email, otp);
    res.json(result);
  } catch (error: any) {
    console.error('[OTP] verify failed:', error.message);
    res.status(400).json({ error: error.message || 'Failed to verify code' });
  }
});

// ─── Receipt Scan ─────────────────────────────────────────────────────────────
app.post('/api/scan-receipt', requireAuth, requirePremium, scanLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const user = (req as any).user;
    const userId: string = user.id;
    const userEmail: string = user.email;
    const accessToken = req.headers.authorization?.split(' ')[1] || '';

    console.log(`[Scan] Processing for user: ${userId} (${userEmail})`);

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // 1. Analyze with Gemini
    console.log('Analyzing receipt with Gemini...');
    const scanResult = await geminiService.analyzeReceipt(
      Buffer.from(imageBase64, 'base64'),
      mimeType || 'image/jpeg'
    );

    // 2. Upload to S3
    console.log('Uploading receipt to S3...');
    const uploadResult = await awsService.uploadReceipt(
      userId,
      Buffer.from(imageBase64, 'base64'),
      `receipt_${Date.now()}.jpg`,
      mimeType || 'image/jpeg'
    );

    // 3. Resolve category
    const categoryId = await resolveCategoryId(accessToken, scanResult.category);

    // 4. Save to Database
    console.log('Saving expense to database...');
    const expense = await expenseService.createExpense(accessToken, {
      userId,
      amount: scanResult.totalAmount,
      currency: scanResult.currency || 'USD',
      date: scanResult.date,
      storeName: scanResult.storeName,
      categoryId,
      items: scanResult.items,
      tax: scanResult.taxAmount || 0,
      receiptImageKey: uploadResult.key,
      metadata: scanResult,
    });

    // 5. Send notification email in the background (non-blocking)
    const hooks: Record<string, string> = {
      Food: `Yummm! ${scanResult.storeName} never disappoints. 🍔`,
      Clothes: `Looking sharp! New threads from ${scanResult.storeName}? 👗`,
      Transport: `Vroom vroom! Your trip at ${scanResult.storeName} is logged. 🚗`,
      Entertainment: `Showtime! Hope ${scanResult.storeName} was a blast! 🍿`,
      Others: `Cha-ching! ${scanResult.storeName} transaction recorded. 💸`,
    };
    const message = hooks[scanResult.category] || hooks['Others'];

    if (userEmail) {
      awsService
        .sendEmail(
          userEmail,
          'Scan Complete!',
          `<h2>${message}</h2><p>Amount: ${scanResult.currency} ${scanResult.totalAmount}</p>`
        )
        .catch(err => console.error('Failed to send email notification:', err.message));
    }

    res.json({ success: true, expense, scanResult });
  } catch (error: any) {
    console.error('Scan Workflow Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Expense CRUD ─────────────────────────────────────────────────────────────

// 1. Create
app.post('/api/expenses', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const userId: string = (req as any).user.id;   // consistent: always use .id
    const result = await expenseService.createExpense(accessToken, {
      ...req.body,
      userId,
      currency: req.body.currency || 'USD',
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Get All (with filters)
app.get('/api/expenses', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const userId: string = (req as any).user.id;
    const { from, to, categoryId, isIncome, storeName, amount, date, tax } = req.query;

    console.log(`[Fetch] for user: ${userId}, filters:`, { from, to, categoryId, amount, date, tax });

    const result = await expenseService.getAllExpenses(accessToken, {
      userId,
      from: from as string,
      to: to as string,
      categoryId: categoryId as string,
      isIncome: isIncome === 'true' ? true : isIncome === 'false' ? false : undefined,
      storeName: storeName as string,
      amount: amount ? parseFloat(amount as string) : undefined,
      date: date as string,
      tax: tax ? parseFloat(tax as string) : undefined,
    });
    console.log(`[Fetch] result count: ${result.length}`);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Single
app.get('/api/expenses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const result = await expenseService.getExpense(accessToken, req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update
app.put('/api/expenses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const result = await expenseService.updateExpense(accessToken, req.params.id as string, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete
app.delete('/api/expenses/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const result = await expenseService.deleteExpense(accessToken, req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Customer Support ─────────────────────────────────────────────────────────
app.post('/api/support', requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, message } = req.body;
    const user = (req as any).user;

    if (!subject || !message) {
      return res.status(400).json({ error: 'subject and message are required' });
    }

    console.log(`[Support] Message from ${user.email} (${user.id}) — Subject: ${subject}`);

    const supportEmail = process.env.AWS_SES_FROM_EMAIL || '';
    const safeSubject = escapeHtml(String(subject));
    const safeMessage = escapeHtml(String(message)).replace(/\n/g, '<br/>');
    const safeEmail = escapeHtml(String(user.email || ''));
    const safeUserId = escapeHtml(String(user.id || ''));

    const emailBody = `
      <h2>New Support Request</h2>
      <p><strong>From:</strong> ${safeEmail} (${safeUserId})</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <hr/>
      <p>${safeMessage}</p>
    `;

    await awsService.sendEmail(supportEmail, `[Support] ${String(subject).slice(0, 120)}`, emailBody);

    // Also send a confirmation to the user
    awsService
      .sendEmail(
        user.email,
        'We got your message!',
        `<p>Hi! We received your support request: <strong>${safeSubject}</strong>. We'll get back to you within 24 hours.</p>`
      )
      .catch(err => console.warn('Support confirmation email failed:', err.message));

    res.status(200).json({ success: true, message: 'Support message received' });
  } catch (error: any) {
    console.error('[Support] Failed to send email:', error.message);
    res.status(500).json({ error: 'Failed to send support message' });
  }
});

// ─── Profile Picture ──────────────────────────────────────────────────────────
app.post('/api/profile/picture', requireAuth, async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const userId: string = (req as any).user.id;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    console.log(`[Profile] Uploading picture for user: ${userId}`);
    const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    const uploadResult = await awsService.uploadProfilePicture(
      userId,
      Buffer.from(imageBase64, 'base64'),
      `profile_${Date.now()}.${ext}`,
      mimeType || 'image/jpeg'
    );
    const url = await awsService.getReceiptUrl(uploadResult.key);

    res.json({ success: true, key: uploadResult.key, url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Receipt URL ──────────────────────────────────────────────────────────────
app.get('/api/expenses/:id/receipt-url', requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const expense = await expenseService.getExpense(accessToken, req.params.id as string);

    if (!expense.receipt_image_key) {
      return res.status(404).json({ error: 'No receipt image found for this expense' });
    }

    const url = await awsService.getReceiptUrl(expense.receipt_image_key);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Excel Export ─────────────────────────────────────────────────────────────
const host = '0.0.0.0';

app.get('/api/reports/export/excel', requireAuth, requirePremium, async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const userId: string = (req as any).user.id;
    const filters = {
      userId,
      from: req.query.from as string,
      to: req.query.to as string,
      categoryId: req.query.categoryId as string,
    };

    const expenses = await expenseService.getAllExpenses(accessToken, filters);

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Store', key: 'store_name', width: 25 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Amount', key: 'total_amount', width: 12 },
      { header: 'Tax', key: 'tax', width: 10 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Items', key: 'items', width: 50 },
    ];

    expenses.forEach((exp: any) => {
      worksheet.addRow({
        date: exp.date,
        store_name: exp.store_name,
        category_name: (exp.categories as any)?.name || 'Uncategorized',
        total_amount: exp.amount,
        tax: exp.tax || 0,
        currency: exp.currency || 'USD',
        items: Array.isArray(exp.expense_items)
          ? exp.expense_items.map((i: any) => `${i.name} x${i.quantity} ($${i.price})`).join(', ')
          : '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Test routes (dev only — not exposed in production) ──────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.post('/test/upload', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, fileName, fileBuffer, contentType } = req.body;
      const result = await awsService.uploadReceipt(userId, Buffer.from(fileBuffer, 'base64'), fileName, contentType);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/test/email', requireAuth, async (req: Request, res: Response) => {
    try {
      const { to, subject, body } = req.body;
      const result = await awsService.sendEmail(to, subject, body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

app.listen(Number(port), host, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
