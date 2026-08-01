import { Request, Response, NextFunction } from 'express';

const TRIAL_DAYS = 14;
const ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID || 'Expense Tracker Premium';

export function calcTrialDaysLeft(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  const diffDays = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, TRIAL_DAYS - diffDays);
}

async function hasRevenueCatEntitlement(userId: string): Promise<boolean> {
  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) return false;

  try {
    const resp = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) return false;

    const data: any = await resp.json();
    const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    if (!entitlement) return false;

    // Lifetime / non-expiring entitlements omit expires_date or set it null
    if (!entitlement.expires_date) return true;
    return new Date(entitlement.expires_date).getTime() > Date.now();
  } catch (err: any) {
    console.warn('[Premium] RevenueCat check failed:', err?.message);
    return false;
  }
}

/** Blocks premium-only routes after the 14-day trial unless RevenueCat shows an active entitlement. */
export const requirePremium = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  if (calcTrialDaysLeft(user.created_at) > 0) {
    return next();
  }

  const entitled = await hasRevenueCatEntitlement(user.id);
  if (entitled) {
    return next();
  }

  return res.status(402).json({
    error: 'Premium subscription required',
    code: 'PREMIUM_REQUIRED',
  });
};
