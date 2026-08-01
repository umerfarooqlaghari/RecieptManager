import React, { useState, useEffect, useRef } from 'react';
import {
  Alert, StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions, Animated,
} from 'react-native';
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/ThemeProvider';
import { sendSignupOtp, verifySignupOtp } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ onBack }: { onBack?: () => void }) {
  const { t, i18n } = useTranslation();
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  async function requestOtp(userId: string, targetEmail: string) {
    await sendSignupOtp(targetEmail, userId);
    setPendingUserId(userId);
    setShowOtpStep(true);
    setOtpCode('');
  }

  // ─── Email / Password ────────────────────────────────────────────────────────
  async function handleEmailAuth() {
    if (!email || !password) {
      Alert.alert('Hold up', 'Please enter your email and password.');
      return;
    }
    if (!isLogin && password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Login Failed', error.message);
      } else {
        if (!firstName || !lastName || !phone) {
          Alert.alert('Hold up', 'Please fill in all your details to create an account.');
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName, phone },
          },
        });
        if (error) {
          Alert.alert('Signup Failed', error.message);
          return;
        }

        // Already confirmed / session issued — AuthProvider will pick this up
        if (data.session) {
          return;
        }

        // Supabase returns an empty identities array when the email is already registered
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          Alert.alert('Account exists', 'This email is already registered. Please log in instead.');
          setIsLogin(true);
          return;
        }

        if (!data.user?.id) {
          Alert.alert('Signup Failed', 'Could not create your account. Please try again.');
          return;
        }

        try {
          await requestOtp(data.user.id, email);
          Alert.alert(t('auth.otp_sent_title'), t('auth.otp_sent_body', { email }));
        } catch (otpErr: any) {
          Alert.alert(
            'Account created',
            otpErr?.message || 'We could not send the verification email. Tap Resend code to try again.'
          );
          setPendingUserId(data.user.id);
          setShowOtpStep(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Hold up', 'Please enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      await verifySignupOtp(email, otpCode);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Verified', 'Email verified. Please log in with your password.');
        setShowOtpStep(false);
        setIsLogin(true);
        return;
      }
      setShowOtpStep(false);
    } catch (e: any) {
      Alert.alert('Verification Failed', e?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!pendingUserId) {
      Alert.alert('Error', 'Missing signup session. Please sign up again.');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(pendingUserId, email);
      Alert.alert(t('auth.otp_sent_title'), t('auth.otp_sent_body', { email }));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async function handleForgotPassword() {
    if (!email) {
      Alert.alert('Enter your email', 'Type your email address above, then tap Forgot Password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('reset-password', { scheme: 'expense-manager' }),
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your inbox', `A password reset link has been sent to ${email}.`);
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setShowOtpStep(false);
    setOtpCode('');
    setPendingUserId(null);
    setShowPassword(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Blobs */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.blobPurple, { backgroundColor: theme.blob1 }]} />
        <View style={[styles.blobTeal, { backgroundColor: theme.blob2 }]} />
        <View style={[styles.blobLight, { backgroundColor: theme.blob3 }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header — two clean rows so nothing collides */}
          <View style={styles.headerTop}>
            <View style={styles.headerRow}>
              {onBack || showOtpStep ? (
                <TouchableOpacity
                  onPress={() => {
                    if (showOtpStep) {
                      setShowOtpStep(false);
                      return;
                    }
                    onBack?.();
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={[styles.iconBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={toggleTheme}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerAction}
                >
                  <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerAction}
                >
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                    {i18n.language === 'en' ? 'ZH' : 'EN'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.brandText, { color: theme.text }]}>Expense Manager</Text>
          </View>

          {/* Big Title + mode switch */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>
              {showOtpStep ? t('auth.verify_email') : isLogin ? t('auth.login') : t('auth.signup')}
            </Text>
            {!showOtpStep && (
              <TouchableOpacity onPress={switchMode} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.toggleText, { color: theme.accent }]}>
                  {isLogin ? t('auth.signup') : t('auth.login')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* OTP step */}
          {showOtpStep ? (
            <View style={styles.inputsSection}>
              <Text style={[styles.otpHint, { color: theme.textDim }]}>
                {t('auth.otp_hint', { email })}
              </Text>

              <BlurView intensity={isDark ? 40 : 100} tint={isDark ? 'light' : 'default'} style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
                <View style={styles.inputInner}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={theme.text} style={styles.icon} />
                  <TextInput
                    style={[styles.input, styles.otpInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    placeholder={t('auth.otp_placeholder')}
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    autoFocus
                  />
                </View>
              </BlurView>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={handleResendOtp} disabled={loading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[styles.resendText, { color: theme.accent }]}>{t('auth.resend_otp')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: isDark ? '#1c1c1e' : '#0f172a' }]}
                  disabled={loading}
                  onPress={handleVerifyOtp}
                >
                  <Text style={styles.submitBtnText}>{t('auth.verify_otp')}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Inputs */
            <View style={styles.inputsSection}>
              {!isLogin && (
                <>
                  <BlurView intensity={isDark ? 40 : 100} tint={isDark ? 'light' : 'default'} style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
                    <View style={styles.inputInner}>
                      <Ionicons name="person-outline" size={24} color={theme.text} style={styles.icon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder={t('profile.first_name')}
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        autoCapitalize="words"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                  </BlurView>

                  <BlurView intensity={isDark ? 40 : 100} tint={isDark ? 'light' : 'default'} style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
                    <View style={styles.inputInner}>
                      <Ionicons name="person-outline" size={24} color={theme.text} style={styles.icon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder={t('profile.last_name')}
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        autoCapitalize="words"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </BlurView>

                  <BlurView intensity={isDark ? 40 : 100} tint={isDark ? 'light' : 'default'} style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
                    <View style={styles.inputInner}>
                      <Ionicons name="call-outline" size={24} color={theme.text} style={styles.icon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder={t('profile.phone')}
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  </BlurView>
                </>
              )}

              <BlurView intensity={isDark ? 40 : 100} tint={isDark ? 'light' : 'default'} style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
                <View style={styles.inputInner}>
                  <Ionicons name="at-circle-outline" size={24} color={theme.text} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    placeholder={t('auth.email')}
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </BlurView>

              <BlurView intensity={isDark ? 40 : 100} tint={isDark ? 'light' : 'default'} style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
                <View style={styles.inputInner}>
                  <Ionicons name="key-outline" size={24} color={theme.text} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    placeholder={t('auth.password')}
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.eyeBtn}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                </View>
              </BlurView>

              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotLink}
                  onPress={handleForgotPassword}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.forgotLinkText, { color: theme.accent }]}>{t('auth.forgot_password')}</Text>
                </TouchableOpacity>
              )}

              {/* Action row */}
              <View style={styles.actionRow}>
                <Text style={[styles.disclaimerText, { color: theme.textDim }]}>
                  Keep all your financial receipts safe, organized, and synced instantly to the cloud.
                </Text>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: isDark ? '#1c1c1e' : '#0f172a' }]}
                  disabled={loading}
                  onPress={handleEmailAuth}
                >
                  <Text style={styles.submitBtnText}>{isLogin ? t('auth.login') : t('auth.signup')}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e0a29ff',
  },
  blobPurple: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#520c61',
    top: -height * 0.1,
    left: -width * 0.2,
    opacity: 0.6,
  },
  blobTeal: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#1f1923ff',
    bottom: height * 0.15,
    right: -width * 0.3,
    opacity: 0.8,
  },
  blobLight: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#5e0e59a9',
    top: height * 0.3,
    left: width * 0.2,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTop: {
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerAction: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  titleContainer: {
    marginBottom: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: {
    fontSize: 44,
    fontWeight: '400',
    letterSpacing: -1,
    flexShrink: 1,
  },
  inputsSection: {
    flex: 1,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 35,
    marginBottom: 15,
    paddingHorizontal: 20,
    height: 65,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  otpInput: {
    letterSpacing: 6,
    fontSize: 20,
    fontWeight: '700',
  },
  otpHint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  icon: {
    opacity: 0.8,
  },
  eyeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    opacity: 0.85,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -4,
  },
  forgotLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    marginRight: 15,
    lineHeight: 14,
  },
  submitBtn: {
    paddingHorizontal: 20,
    height: 45,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
