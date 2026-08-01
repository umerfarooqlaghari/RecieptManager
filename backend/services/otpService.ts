import crypto from 'crypto';
import * as awsService from './awsService';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

type OtpRecord = {
  hash: string;
  userId: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
};

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;

/** In-memory OTP store (single API instance). */
const otpStore = new Map<string, OtpRecord>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashOtp(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function otpEmailHtml(code: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">Verify your email</h2>
      <p style="margin: 0 0 20px; color: #475569; line-height: 1.5;">
        Use this one-time code to finish creating your Expense Manager account:
      </p>
      <div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #0f172a; background: #f1f5f9; padding: 16px 20px; border-radius: 12px; text-align: center;">
        ${code}
      </div>
      <p style="margin: 20px 0 0; color: #94a3b8; font-size: 13px;">
        This code expires in 10 minutes. If you didn’t request it, you can ignore this email.
      </p>
    </div>
  `;
}

export async function sendSignupOtp(email: string, userId: string) {
  const key = normalizeEmail(email);
  if (!key || !userId) {
    throw new Error('Email and userId are required');
  }

  const existing = otpStore.get(key);
  if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
    throw new Error(`Please wait ${waitSec}s before requesting another code.`);
  }

  const code = generateOtp();
  otpStore.set(key, {
    hash: hashOtp(code),
    userId,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now(),
  });

  await awsService.sendEmail(
    key,
    'Your Expense Manager verification code',
    otpEmailHtml(code),
    true
  );

  return { success: true, expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifySignupOtp(email: string, code: string) {
  const key = normalizeEmail(email);
  const record = otpStore.get(key);

  if (!record) {
    throw new Error('No verification code found. Please request a new one.');
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    throw new Error('Code expired. Please request a new one.');
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    throw new Error('Too many attempts. Please request a new code.');
  }

  record.attempts += 1;
  if (hashOtp(String(code).trim()) !== record.hash) {
    throw new Error('Invalid verification code.');
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(record.userId, {
    email_confirm: true,
  });
  if (error) {
    throw new Error(error.message || 'Failed to confirm email');
  }

  otpStore.delete(key);
  return { success: true, userId: record.userId };
}
