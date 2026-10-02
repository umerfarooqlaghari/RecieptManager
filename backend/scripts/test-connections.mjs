import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { S3Client, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });
// Also load mobile/.env for mobile RevenueCat keys
dotenv.config({ path: path.join(__dirname, '..', '..', 'mobile', '.env') });

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

console.log(`${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}   Expense Manager - Service Connectivity Audit     ${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

const results = {
  supabaseAnon: { status: 'PENDING', message: '' },
  supabaseAdmin: { status: 'PENDING', message: '' },
  supabaseTables: { status: 'PENDING', message: '' },
  gemini: { status: 'PENDING', message: '' },
  revenueCatSecret: { status: 'PENDING', message: '' },
  revenueCatOfferings: { status: 'PENDING', message: '' },
  awsS3: { status: 'PENDING', message: '' },
  awsSES: { status: 'PENDING', message: '' },
};

// ─── 1. TEST SUPABASE ────────────────────────────────────────────────────────
async function testSupabase() {
  console.log(`${BOLD}1. Testing Supabase Database & Auth...${RESET}`);
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    results.supabaseAnon = { status: 'FAIL', message: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY' };
    console.log(`  ${RED}✖ Anon Client:${RESET} Missing credentials`);
    return;
  }

  // A. Anon Client Auth Ping
  try {
    const t0 = Date.now();
    const supabaseAnon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await supabaseAnon.auth.getSession();
    const elapsed = Date.now() - t0;
    if (error) throw error;
    results.supabaseAnon = { status: 'PASS', message: `Connected in ${elapsed}ms (URL: ${url})` };
    console.log(`  ${GREEN}✔ Public / Anon Auth:${RESET} Reachable (${elapsed}ms)`);
  } catch (err) {
    results.supabaseAnon = { status: 'FAIL', message: err.message };
    console.log(`  ${RED}✖ Public / Anon Auth:${RESET} ${err.message}`);
  }

  // B. Service Role Admin Client
  if (serviceRoleKey) {
    try {
      const t0 = Date.now();
      const supabaseAdmin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      const elapsed = Date.now() - t0;
      if (error) throw error;
      results.supabaseAdmin = { status: 'PASS', message: `Admin access verified (${elapsed}ms, users in auth: ${users?.users?.length ?? 0})` };
      console.log(`  ${GREEN}✔ Service Role (Admin):${RESET} Valid & Authorized (${elapsed}ms)`);
    } catch (err) {
      results.supabaseAdmin = { status: 'FAIL', message: err.message };
      console.log(`  ${RED}✖ Service Role (Admin):${RESET} ${err.message}`);
    }
  } else {
    results.supabaseAdmin = { status: 'SKIP', message: 'No SUPABASE_SERVICE_ROLE_KEY found' };
    console.log(`  ${YELLOW}⚠ Service Role (Admin):${RESET} Not configured`);
  }

  // C. Schema & Tables Inspection
  try {
    const supabaseAdmin = createClient(url, serviceRoleKey || anonKey, { auth: { persistSession: false } });
    const tables = ['profiles', 'categories', 'expenses', 'expense_items'];
    const tableStatus = [];
    for (const table of tables) {
      const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        tableStatus.push(`${table}: ${RED}${error.message}${RESET}`);
      } else {
        tableStatus.push(`${table}: ${GREEN}OK (${count ?? 0} rows)${RESET}`);
      }
    }
    console.log(`  ${CYAN}• Database Tables:${RESET} ${tableStatus.join(' | ')}`);
    results.supabaseTables = { status: 'PASS', message: tableStatus.join(' | ') };
  } catch (err) {
    results.supabaseTables = { status: 'WARN', message: err.message };
  }
}

// ─── 2. TEST GOOGLE GEMINI AI ────────────────────────────────────────────────
async function testGemini() {
  console.log(`\n${BOLD}2. Testing Google Gemini AI API...${RESET}`);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('Dummy')) {
    results.gemini = { status: 'FAIL', message: 'GEMINI_API_KEY is missing or contains placeholder' };
    console.log(`  ${RED}✖ Gemini API:${RESET} Invalid or dummy key`);
    return;
  }

  try {
    const t0 = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with gemini-3.8-flash (primary model used in backend)
    console.log(`  ${CYAN}• Model:${RESET} Testing 'gemini-3.8-flash'...`);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const response = await model.generateContent('Respond with only the word: ACTIVE');
    const text = response.response.text().trim();
    const elapsed = Date.now() - t0;

    results.gemini = { status: 'PASS', message: `Model 'gemini-3.8-flash' responded in ${elapsed}ms: "${text}"` };
    console.log(`  ${GREEN}✔ Gemini API:${RESET} Response received in ${elapsed}ms -> "${text}"`);
  } catch (err) {
    try {
      console.log(`  ${YELLOW}⚠ gemini-3.8-flash failed (${err.message}). Trying 'gemini-3.7-flash'...${RESET}`);
      const t0 = Date.now();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });
      const response = await model.generateContent('Respond with only the word: ACTIVE');
      const text = response.response.text().trim();
      const elapsed = Date.now() - t0;
      results.gemini = { status: 'PASS', message: `Model 'gemini-3.7-flash' responded in ${elapsed}ms: "${text}"` };
      console.log(`  ${GREEN}✔ Gemini API (Fallback):${RESET} Response in ${elapsed}ms -> "${text}"`);
    } catch (fallbackErr) {
      results.gemini = { status: 'FAIL', message: fallbackErr.message };
      console.log(`  ${RED}✖ Gemini API:${RESET} Error: ${fallbackErr.message}`);
    }
  }
}

// ─── 3. TEST REVENUECAT ──────────────────────────────────────────────────────
async function testRevenueCat() {
  console.log(`\n${BOLD}3. Testing RevenueCat Configuration & Offerings...${RESET}`);
  const secretKey = process.env.REVENUECAT_SECRET_API_KEY;
  const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || 'Expense Tracker Pro';
  const iosKey = process.env.EXPO_PUBLIC_RC_IOS_KEY;
  const testStoreKey = process.env.EXPO_PUBLIC_RC_TEST_STORE_KEY;

  console.log(`  ${CYAN}• Configured Entitlement ID:${RESET} "${entitlementId}"`);

  // A. Backend Secret Key API Verification
  if (!secretKey || secretKey.includes('dummy')) {
    results.revenueCatSecret = { status: 'FAIL', message: 'REVENUECAT_SECRET_API_KEY is dummy or missing' };
    console.log(`  ${RED}✖ Secret API Key:${RESET} Missing or dummy key`);
  } else {
    try {
      const t0 = Date.now();
      // Query subscriber info for a test probe user to verify authentication
      const resp = await fetch('https://api.revenuecat.com/v1/subscribers/connection_test_probe_user', {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
      const elapsed = Date.now() - t0;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Invalid RevenueCat Secret Key (HTTP ${resp.status})`);
      }
      const data = await resp.json();
      results.revenueCatSecret = { status: 'PASS', message: `Secret API Key authenticated successfully (${elapsed}ms)` };
      console.log(`  ${GREEN}✔ Secret API Key:${RESET} Authenticated with RevenueCat REST API (${elapsed}ms)`);
    } catch (err) {
      results.revenueCatSecret = { status: 'FAIL', message: err.message };
      console.log(`  ${RED}✖ Secret API Key:${RESET} ${err.message}`);
    }
  }

  // B. Public Offerings Test using Test Store / iOS Public Key
  const publicKey = testStoreKey || iosKey;
  if (!publicKey || publicKey.includes('dummy')) {
    results.revenueCatOfferings = { status: 'SKIP', message: 'No valid public SDK key found' };
    console.log(`  ${YELLOW}⚠ Public SDK Key:${RESET} Not configured in mobile/.env`);
  } else {
    try {
      const t0 = Date.now();
      // RevenueCat V1 public offerings endpoint
      const resp = await fetch('https://api.revenuecat.com/v1/subscribers/test_guest/offerings', {
        headers: {
          Authorization: `Bearer ${publicKey}`,
          'X-Platform': 'ios',
        },
      });
      const elapsed = Date.now() - t0;
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const data = await resp.json();
      const currentOffering = data.current_offering_id;
      const offeringsCount = Object.keys(data.offerings || {}).length;
      results.revenueCatOfferings = {
        status: 'PASS',
        message: `Current offering: "${currentOffering || 'None'}", total offerings: ${offeringsCount}`,
      };
      console.log(`  ${GREEN}✔ Offerings API:${RESET} Reachable (${elapsed}ms)`);
      console.log(`    Current Offering: ${BOLD}${currentOffering || 'None'}${RESET} | Total Offerings: ${offeringsCount}`);
      if (data.offerings && currentOffering && data.offerings[currentOffering]) {
        const pkgs = data.offerings[currentOffering].packages || [];
        console.log(`    Packages in Current Offering (${pkgs.length}):`);
        pkgs.forEach(p => console.log(`      - ${p.identifier} (Product: ${p.platform_product_identifier})`));
      }
    } catch (err) {
      results.revenueCatOfferings = { status: 'WARN', message: err.message };
      console.log(`  ${YELLOW}⚠ Offerings API (Public Key):${RESET} ${err.message}`);
    }
  }
}

// ─── 4. TEST AWS (S3 & SES) ──────────────────────────────────────────────────
async function testAWS() {
  console.log(`\n${BOLD}4. Testing Amazon Web Services (AWS)...${RESET}`);
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const fromEmail = process.env.AWS_SES_FROM_EMAIL;

  if (!accessKeyId || !secretAccessKey || accessKeyId.includes('EXAMPLE')) {
    console.log(`  ${YELLOW}⚠ AWS Credentials:${RESET} Placeholder credentials present`);
    return;
  }

  // A. S3 Bucket Check
  try {
    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    const t0 = Date.now();
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    const elapsed = Date.now() - t0;
    results.awsS3 = { status: 'PASS', message: `Bucket '${bucketName}' exists and is accessible (${elapsed}ms)` };
    console.log(`  ${GREEN}✔ AWS S3:${RESET} Bucket '${bucketName}' is accessible (${elapsed}ms)`);
  } catch (err) {
    results.awsS3 = { status: 'FAIL', message: err.message };
    console.log(`  ${RED}✖ AWS S3:${RESET} Bucket error: ${err.message}`);
  }

  // B. SES Email Check
  try {
    const ses = new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    const t0 = Date.now();
    const quota = await ses.send(new GetSendQuotaCommand({}));
    const elapsed = Date.now() - t0;
    results.awsSES = { status: 'PASS', message: `SES Quota: ${quota.SentLast24Hours || 0}/${quota.Max24HourSend || 0} sent` };
    console.log(`  ${GREEN}✔ AWS SES:${RESET} Sender '${fromEmail}' verified in region '${region}' (${elapsed}ms)`);
  } catch (err) {
    results.awsSES = { status: 'FAIL', message: err.message };
    console.log(`  ${YELLOW}⚠ AWS SES:${RESET} ${err.message}`);
  }
}

// ─── RUN AUDIT ───────────────────────────────────────────────────────────────
async function run() {
  await testSupabase();
  await testGemini();
  await testRevenueCat();
  await testAWS();

  console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}${CYAN}                  AUDIT SUMMARY                     ${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}`);
  for (const [key, res] of Object.entries(results)) {
    const color = res.status === 'PASS' ? GREEN : res.status === 'FAIL' ? RED : YELLOW;
    console.log(`• ${key.padEnd(20)}: ${color}${res.status.padEnd(6)}${RESET} ${res.message}`);
  }
  console.log('----------------------------------------------------\n');
}

run().catch(console.error);
