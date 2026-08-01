const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function sendSignupOtp(email: string, userId: string) {
  const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, userId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send verification code');
  }
  return data;
}

export async function verifySignupOtp(email: string, otp: string) {
  const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify code');
  }
  return data;
}
