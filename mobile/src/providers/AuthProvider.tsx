import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { initPurchases, ENTITLEMENT_ID, isPurchasesReady, hasPremiumEntitlement } from '../services/subscriptionService';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  trialDaysLeft: number;
  refreshPremium: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isPremium: false,
  trialDaysLeft: 0,
  refreshPremium: async () => {},
});

/** Returns how many trial days are left based on user's signup date */
function calcTrialDaysLeft(user: User | null): number {
  if (!user?.created_at) return 0;
  const diffDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, 14 - diffDays);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  // Keep a ref so callbacks always see the latest user without needing to re-register
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Keep a ref to trialDaysLeft so the RC listener always has the current value
  const trialDaysLeftRef = useRef(0);
  trialDaysLeftRef.current = trialDaysLeft;

  const rcLoggedInUserIdRef = useRef<string | null>(null);

  const syncRevenueCatUser = async (currentUser: User | null) => {
    try {
      if (!currentUser) {
        rcLoggedInUserIdRef.current = null;
        if (isPurchasesReady()) {
          Purchases.isAnonymous()
            .then(isAnon => { if (!isAnon) return Purchases.logOut(); })
            .catch(() => {});
        }
        setIsPremium(false);
        setTrialDaysLeft(0);
        return;
      }

      if (!isPurchasesReady()) {
        await checkPremium(currentUser);
        return;
      }

      if (rcLoggedInUserIdRef.current === currentUser.id) {
        await checkPremium(currentUser);
        return;
      }

      rcLoggedInUserIdRef.current = currentUser.id;
      try {
        await Purchases.logIn(currentUser.id);
      } catch (e) {
        console.warn('[RevenueCat] Login failed:', e);
      }
      await checkPremium(currentUser);
    } catch (e) {
      console.warn('[RevenueCat] sync failed:', e);
      const days = calcTrialDaysLeft(currentUser);
      setTrialDaysLeft(days);
      setIsPremium(days > 0);
    }
  };

  const applyPremiumState = (info: CustomerInfo, currentUser: User | null) => {
    const hasEntitlement = hasPremiumEntitlement(info);
    const days = calcTrialDaysLeft(currentUser);
    setTrialDaysLeft(days);
    setIsPremium(hasEntitlement || days > 0);
  };

  const checkPremium = async (currentUser: User | null) => {
    if (!isPurchasesReady()) {
      const days = calcTrialDaysLeft(currentUser);
      setTrialDaysLeft(days);
      setIsPremium(days > 0);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      applyPremiumState(info, currentUser);
    } catch {
      // RevenueCat unavailable – fall back to trial-only
      const days = calcTrialDaysLeft(currentUser);
      setTrialDaysLeft(days);
      setIsPremium(days > 0);
    }
  };

  const refreshPremium = async () => {
    await checkPremium(userRef.current);
  };

  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    const customerInfoListener = (info: CustomerInfo) => {
      const hasEntitlement = hasPremiumEntitlement(info);
      setIsPremium(hasEntitlement || trialDaysLeftRef.current > 0);
    };

    const boot = async () => {
      try {
        await initPurchases();
      } catch (e) {
        console.error('RC Init Error:', e);
      }

      if (cancelled) return;

      if (isPurchasesReady()) {
        try {
          const unsub = Purchases.addCustomerInfoUpdateListener(customerInfoListener);
          if (typeof unsub === 'function') removeListener = unsub;
        } catch {}
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && !cancelled) {
        await syncRevenueCatUser(session.user);
      }
      setIsLoading(false);
    };

    boot();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      syncRevenueCatUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      if (typeof removeListener === 'function') {
        removeListener();
      } else if (isPurchasesReady()) {
        try {
          Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
        } catch {}
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isPremium, trialDaysLeft, refreshPremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
