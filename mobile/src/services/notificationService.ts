import { Platform } from 'react-native';

type ExpoNotifications = typeof import('expo-notifications');

let Notifications: ExpoNotifications | null = null;
let initPromise: Promise<boolean> | null = null;

function loadModule(): ExpoNotifications | null {
  if (Notifications) return Notifications;
  try {
    Notifications = require('expo-notifications') as ExpoNotifications;
    return Notifications;
  } catch {
    console.warn('[Notifications] expo-notifications not available');
    return null;
  }
}

/** Configure handler + Android channel. Safe to call multiple times. */
export async function initNotifications(): Promise<boolean> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mod = loadModule();
    if (!mod) return false;

    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await mod.setNotificationChannelAsync('default', {
        name: 'Expense Manager',
        importance: mod.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
        sound: 'default',
        enableVibrate: true,
      });
    }

    return true;
  })();

  return initPromise;
}

export async function registerForNotifications(): Promise<boolean> {
  const ready = await initNotifications();
  const mod = loadModule();
  if (!ready || !mod) return false;

  try {
    const { status: existing } = await mod.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await mod.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[Notifications] Permission request failed:', e);
    return false;
  }
}

export async function notifyExpenseLogged(storeName?: string): Promise<void> {
  const ready = await initNotifications();
  const mod = loadModule();
  if (!ready || !mod) return;

  const granted = await registerForNotifications();
  if (!granted) return;

  try {
    await mod.scheduleNotificationAsync({
      content: {
        title: 'Expense logged',
        body: storeName ? `Added from ${storeName}` : 'Your receipt was saved successfully.',
        sound: Platform.OS === 'ios' ? 'default' : undefined,
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('[Notifications] Failed to schedule notification:', e);
  }
}
