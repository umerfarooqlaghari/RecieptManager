import { calcTrialDaysLeft } from '../../backend/middleware/premium';

describe('calcTrialDaysLeft', () => {
  it('returns 0 when created_at is missing', () => {
    expect(calcTrialDaysLeft(undefined)).toBe(0);
  });

  it('returns full trial for a brand-new account', () => {
    const created = new Date().toISOString();
    expect(calcTrialDaysLeft(created)).toBe(14);
  });

  it('returns 0 after trial window', () => {
    const created = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcTrialDaysLeft(created)).toBe(0);
  });

  it('returns remaining days mid-trial', () => {
    const created = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcTrialDaysLeft(created)).toBe(9);
  });
});
