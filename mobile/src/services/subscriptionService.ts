import Purchases, { LOG_LEVEL, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { LogBox, Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * RevenueCat PUBLIC SDK keys only — never put sk_ secret keys in the mobile app.
 * - iOS App Store: EXPO_PUBLIC_RC_IOS_KEY (appl_...)
 * - Dev / simulator: EXPO_PUBLIC_RC_TEST_STORE_KEY (test_...)
 * Secret key belongs in backend/.env as REVENUECAT_SECRET_API_KEY only.
 *
 * Test Store requires react-native-purchases >= 9.5.4 and a matching native rebuild.
 */
const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY || '';
const TEST_STORE_KEY = process.env.EXPO_PUBLIC_RC_TEST_STORE_KEY || '';

// Don't red-screen the app for RevenueCat dashboard / key noise
LogBox.ignoreLogs([
  'RevenueCat',
  '[RevenueCat]',
  'API Key is not recognized',
  'OfferingsManager.Error',
  'no products registered',
  'Purchases instance already set',
]);

function resolveApiKey(): string {
  if (Platform.OS === 'android') {
    return ANDROID_KEY || TEST_STORE_KEY;
  }

  // Simulator: Test Store (no App Store / StoreKit required)
  const isSimulator = __DEV__ && !Constants.isDevice;
  if (isSimulator && TEST_STORE_KEY) {
    return TEST_STORE_KEY;
  }

  return IOS_KEY || TEST_STORE_KEY;
}

export const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || 'Expense Tracker Premium';
export const ENTITLEMENT_ID_ALT = 'Expense Tracker Pro';

export function hasPremiumEntitlement(info: { entitlements: { active: Record<string, unknown> } }): boolean {
  const active = info.entitlements.active;
  return !!(active[ENTITLEMENT_ID] || active[ENTITLEMENT_ID_ALT]);
}

let purchasesConfigured = false;
let initPromise: Promise<void> | null = null;

export const isPurchasesReady = (): boolean => purchasesConfigured;

export const PACKAGE_IDS = {
  MONTHLY: 'ext_399_1m',
  YEARLY: 'ext_34.99_1y',
  LIFETIME: 'ext_lifetimeaccess',
};

/** App Store + Test Store product IDs */
export const PACKAGE_ID_FALLBACKS: Record<keyof typeof PACKAGE_IDS, string[]> = {
  MONTHLY: ['ext_399_1m', 'monthly', 'monthly_test'],
  YEARLY: ['ext_34.99_1y', 'ext_24.99_1y', 'yearly', 'yearly_test'],
  LIFETIME: ['ext_lifetimeaccess', 'subscription_lifetime', 'lifetime', 'ext_5999_1life', 'Lifetime_test'],
};

export const isTestStoreMode = (): boolean => resolveApiKey().startsWith('test_');

export const PLAN_PRICES_USD = {
  MONTHLY: 3.99,
  YEARLY: 34.99,
  LIFETIME: 79.99,
} as const;

async function installQuietLogHandler() {
  try {
    Purchases.setLogHandler((level, message) => {
      // Keep useful signal without LogBox red/yellow screens
      if (level === LOG_LEVEL.ERROR) {
        console.warn('[RevenueCat]', message);
        return;
      }
      if (__DEV__ && (level === LOG_LEVEL.WARN || level === LOG_LEVEL.INFO)) {
        console.log('[RevenueCat]', message);
      }
    });
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
  } catch {
    // Older / mismatched native modules may not support setLogHandler
  }
}

export const initPurchases = async (): Promise<void> => {
  if (purchasesConfigured) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const apiKey = resolveApiKey();
      if (!apiKey) {
        console.warn('[RevenueCat] No public SDK key for', Platform.OS);
        return;
      }
      if (apiKey.startsWith('sk_')) {
        console.warn('[RevenueCat] Secret keys (sk_) must not be used in the mobile app.');
        return;
      }

      await installQuietLogHandler();

      // configure is sync in RN SDK; wrap so a native throw never escapes boot
      Purchases.configure({ apiKey });
      purchasesConfigured = true;
      console.log(
        '[RevenueCat] Configured for',
        Platform.OS,
        apiKey.startsWith('test_') ? '(Test Store)' : '(App Store)'
      );
    } catch (e: any) {
      purchasesConfigured = false;
      const msg = e?.message || String(e);
      if (/HostFunction|Native module|null/i.test(msg)) {
        console.warn(
          '[RevenueCat] Native module mismatch. Rebuild the iOS app: cd mobile && npx expo run:ios'
        );
      } else {
        console.warn('[RevenueCat] Initialization failed:', msg);
      }
    }
  })();

  try {
    await initPromise;
  } catch {
    // never reject — app must boot without subscriptions
  }
  return;
};

export type OfferingsResult =
  | { status: 'ok'; offering: PurchasesOffering }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

export const getOfferings = async (): Promise<OfferingsResult> => {
  if (!purchasesConfigured) {
    return { status: 'error', message: 'RevenueCat is not configured. Rebuild the app if you just updated packages.' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (current?.availablePackages?.length) {
      return { status: 'ok', offering: current };
    }
    const testHint = isTestStoreMode()
      ? ' Simulator uses Test Store — attach monthly_test, yearly_test, and Lifetime_test to packages in Expense Sage Offering (keep Apple products too).'
      : ' Ensure Expense Sage Offering packages have App Store products attached.';
    return {
      status: 'empty',
      message: `Offering has no packages for this store.${testHint}`,
    };
  } catch (e: any) {
    const msg = e?.message || 'Failed to load offerings';
    if (/no products registered|offerings-empty/i.test(msg)) {
      return { status: 'empty', message: msg };
    }
    console.warn('[RevenueCat] Offerings fetch failed:', msg);
    return { status: 'error', message: msg };
  }
};

export const purchasePackage = async (pack: PurchasesPackage): Promise<{ success: boolean; customerInfo?: any }> => {
  if (!purchasesConfigured) {
    throw new Error('Subscriptions are not available on this device.');
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    return { success: hasPremiumEntitlement(customerInfo), customerInfo };
  } catch (e: any) {
    if (e.userCancelled) return { success: false };
    throw e;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!purchasesConfigured) return false;
  try {
    const customerInfo = await Purchases.restorePurchases();
    return hasPremiumEntitlement(customerInfo);
  } catch (e) {
    console.warn('[RevenueCat] Restore failed:', e);
    return false;
  }
};
