import React, { useState, useEffect, useRef } from 'react';
import { 
  Alert, StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Dimensions, Animated 
} from 'react-native';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  async function handleEmailAuth() {
    if (!email || !password) {
      Alert.alert('Hold up', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login Failed', error.message);
    } else {
      if (!firstName || !lastName || !phone) {
        Alert.alert('Hold up', 'Please fill in all your details to create an account.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          }
        }
      });
      if (error) Alert.alert('Signup Failed', error.message);
      else if (!data.session) Alert.alert('Success!', 'Check your email for the confirmation link.');
    }
    setLoading(false);
  }

  async function performOAuth(providerName: 'google' | 'apple' | 'facebook') {
    try {
      setLoading(true);
      const redirectTo = makeRedirectUri();
      
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: providerName,
          options: { redirectTo },
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: providerName,
          options: { redirectTo, skipBrowserRedirect: true },
        });

        if (error) throw error;

        if (data?.url) {
          const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          if (res.type === 'success') {
            const params = Linking.parse(res.url).queryParams;
            if (params?.error_description) throw new Error(params.error_description as string);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message);
    } finally {
      if (Platform.OS !== 'web') {
        setLoading(false);
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Background Blobs without frost overlay */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.blobPurple} />
        <View style={styles.blobTeal} />
        <View style={styles.blobLight} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        {/* Animated Wrapper for the entire layout */}
        <Animated.ScrollView 
          style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* Top Header */}
          <View style={styles.headerTop}>
            <View style={styles.brandContainer}>
              <Ionicons name="checkmark-circle" size={26} color="#ffffff" style={styles.brandIcon} />
              <Text style={styles.brandText}>ReceiptManager</Text>
            </View>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.toggleText}>{isLogin ? 'Sign up' : 'Log in'}</Text>
            </TouchableOpacity>
          </View>

          {/* Big Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{isLogin ? 'Log in' : 'Sign up'}</Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputsSection}>

            {!isLogin && (
              <>
                <BlurView intensity={40} tint="light" style={styles.inputWrapper}>
                  <View style={styles.inputInner}>
                    <Ionicons name="person-outline" size={24} color="#ffffff" style={styles.icon} />
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder="first name"
                      placeholderTextColor="#ffffffff"
                      autoCapitalize="words"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </BlurView>

                <BlurView intensity={40} tint="light" style={styles.inputWrapper}>
                  <View style={styles.inputInner}>
                    <Ionicons name="person-outline" size={24} color="#ffffff" style={styles.icon} />
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder="last name"
                      placeholderTextColor="#ffffffff"
                      autoCapitalize="words"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </BlurView>

                <BlurView intensity={40} tint="light" style={styles.inputWrapper}>
                  <View style={styles.inputInner}>
                    <Ionicons name="call-outline" size={24} color="#ffffff" style={styles.icon} />
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder="phone number"
                      placeholderTextColor="#ffffffff"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </BlurView>
              </>
            )}

            <BlurView intensity={40} tint="light" style={styles.inputWrapper}>
              <View style={styles.inputInner}>
                <Ionicons name="at-circle-outline" size={24} color="#ffffff" style={styles.icon} />
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholder="e-mail address"
                  placeholderTextColor="#ffffffff"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </BlurView>

            <BlurView intensity={40} tint="light" style={styles.inputWrapper}>
              <View style={styles.inputInner}>
                <Ionicons name="key-outline" size={24} color="#ffffff" style={styles.icon} />
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholder="password"
                  placeholderTextColor="#ffffffff"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                {isLogin && (
                  <View style={styles.forgotPill}>
                    <Text style={styles.forgotText}>I forgot</Text>
                  </View>
                )}
              </View>
            </BlurView>

            {/* Text block and Arrow Button */}
            <View style={styles.actionRow}>
              <Text style={styles.disclaimerText}>
                Keep all your financial receipts safe, organized, and synced instantly to the cloud. Start managing your expenses.
              </Text>
              <TouchableOpacity 
                style={styles.submitBtn} 
                disabled={loading} 
                onPress={handleEmailAuth}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Social Accounts Section */}
          <View style={styles.bottomSection}>
            <View style={styles.referencesCard}>
              <Text style={styles.refTitle}>Continue with</Text>
              <Text style={styles.refSubtitle}>Social Accounts</Text>
              
              <View style={styles.socialRow}>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#333' }]} disabled={loading} onPress={() => performOAuth('apple')}>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#ea4335' }]} disabled={loading} onPress={() => performOAuth('google')}>
                  <Ionicons name="logo-google" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} disabled={loading} onPress={() => performOAuth('facebook')}>
                  <Ionicons name="logo-facebook" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e0a29ff', // Light base so the frost works nicely
  },
  blobPurple: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#520c61', // Your requested deep purple
    top: -height * 0.1,
    left: -width * 0.2,
    opacity: 0.6,
  },
  blobTeal: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#1f1923ff', // Softer violet for contrast
    bottom: height * 0.15,
    right: -width * 0.3,
    opacity: 0.8,
  },
  blobLight: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#5e0e59a9', // Glowing bright purple
    top: height * 0.3,
    left: width * 0.2,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: 6,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: -1,
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
    overflow: 'hidden', // Ensures BlurView stays rounded inside iOS and modern browsers
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Frost border effect
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
  icon: {
    opacity: 0.8,
  },
  forgotPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  forgotText: {
    color: '#1c1c1e',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#eaeaea',
    marginRight: 20,
    lineHeight: 16,
    opacity: 0.8,
  },
  submitBtn: {
    backgroundColor: '#1c1c1e',
    width: 65,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomSection: {
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  referencesCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 30,
    padding: 30,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  refTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  refSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  socialRow: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 15,
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
