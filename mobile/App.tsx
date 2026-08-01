import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Modal, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LandingScreen from './src/screens/LandingScreen';
import IntroScreen from './src/screens/IntroScreen';
import AnimatedSplash from './src/components/AnimatedSplash';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { supabase } from './src/lib/supabase';
import { initNotifications } from './src/services/notificationService';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Password Reset Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Password updated', 'Your password has been changed successfully.');
      setPassword('');
      setConfirm('');
      onDone();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={resetStyles.overlay}>
        <SafeAreaView style={resetStyles.card}>
          <Text style={resetStyles.title}>Set New Password</Text>
          <Text style={resetStyles.subtitle}>Enter a new password for your account.</Text>
          <TextInput
            style={resetStyles.input}
            placeholder="New password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={resetStyles.input}
            placeholder="Confirm new password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            autoCapitalize="none"
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity
            style={[resetStyles.btn, loading && { opacity: 0.7 }]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={resetStyles.btnText}>Update Password</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={onDone}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const resetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 50,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 28,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

type GuestScreen = 'landing' | 'intro' | 'auth';

// ─── Route ────────────────────────────────────────────────────────────────────
function Route() {
  const { session, isLoading } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);
  const [guestScreen, setGuestScreen] = useState<GuestScreen>('landing');

  useEffect(() => {
    if (!session?.user) setGuestScreen('landing');
  }, [session]);

  // Handle deep links — password reset arrives as:
  // expense-manager://reset-password#access_token=...&refresh_token=...&type=recovery
  const handleUrl = useCallback(async (url: string | null) => {
    if (!url) return;

    const parsed = Linking.parse(url);

    // Password reset: type=recovery in the fragment
    if (parsed.path === 'reset-password') {
      // Supabase sends tokens in the URL fragment (#), not query params
      // Expo Linking puts fragment key-value pairs into `queryParams` on some versions,
      // or we parse the raw fragment ourselves.
      const raw = url.split('#')[1] ?? '';
      const params = Object.fromEntries(new URLSearchParams(raw));
      const access_token = params.access_token ?? parsed.queryParams?.access_token as string;
      const refresh_token = params.refresh_token ?? parsed.queryParams?.refresh_token as string;

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) {
          setShowResetModal(true);
        } else {
          Alert.alert('Link expired', 'This reset link has expired. Please request a new one.');
        }
      }
    }
  }, []);

  // Handle URL when app is already open (foreground deep link)
  const url = Linking.useURL();
  useEffect(() => {
    handleUrl(url ?? null);
  }, [url, handleUrl]);

  // Handle URL when app is opened cold from the link
  useEffect(() => {
    Linking.getInitialURL().then(handleUrl);
  }, [handleUrl]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  if (!session?.user) {
    if (guestScreen === 'landing') {
      return (
        <>
          <LandingScreen
            onExplore={() => setGuestScreen('intro')}
            onSignIn={() => setGuestScreen('auth')}
          />
          <ResetPasswordModal visible={showResetModal} onDone={() => setShowResetModal(false)} />
        </>
      );
    }
    if (guestScreen === 'intro') {
      return (
        <>
          <IntroScreen
            onBack={() => setGuestScreen('landing')}
            onSkip={() => setGuestScreen('auth')}
            onFinish={() => setGuestScreen('auth')}
            onSignIn={() => setGuestScreen('auth')}
          />
          <ResetPasswordModal visible={showResetModal} onDone={() => setShowResetModal(false)} />
        </>
      );
    }
    return (
      <>
        <AuthScreen onBack={() => setGuestScreen('landing')} />
        <ResetPasswordModal visible={showResetModal} onDone={() => setShowResetModal(false)} />
      </>
    );
  }

  return (
    <>
      <HomeScreen />
      <ResetPasswordModal
        visible={showResetModal}
        onDone={() => setShowResetModal(false)}
      />
    </>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initNotifications();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <View style={styles.container} onLayout={onLayoutRootView}>
            {splashAnimationComplete ? (
              <Route />
            ) : (
              <AnimatedSplash onFinish={() => setSplashAnimationComplete(true)} />
            )}
          </View>
        </AuthProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
