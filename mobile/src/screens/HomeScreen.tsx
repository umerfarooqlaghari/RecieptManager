import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, Alert, RefreshControl, ActivityIndicator, Image, TextInput, Modal, Platform, SafeAreaView, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LineChart } from 'react-native-gifted-charts';
import { fetchExpenses, deleteExpense, updateExpense, getReceiptUrl, createExpense, submitSupport, uploadProfilePicture, exportExpensesExcel } from '../services/expenseService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/ThemeProvider';
import PaywallScreen from './PaywallScreen';
import { formatMoney, toAmount } from '../utils/money';
import { monthRange, toLocalDateString } from '../utils/dates';
import { initNotifications, registerForNotifications, notifyExpenseLogged } from '../services/notificationService';
import { Currency, fetchCurrencies, getCurrencySymbol, getUserCurrency, setUserCurrency, convertCurrencyLocally, hasUserSetCurrency } from '../services/currencyService';

const { width, height } = Dimensions.get('window');

const TOP_SECTION_HEIGHT = height * 0.4;

const MONTH_KEYS = ['all', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const PERIOD_KEYS = ['all', '3m', '6m', 'year', 'custom'];

const PRIVACY_POLICY = `
Privacy Policy for Expense Manager

Effective Date: March 27, 2026

At Expense Manager, your privacy is our top priority. We are committed to protecting your personal data and ensuring a secure experience.

1. Data Collection
We collect minimal information required to provide our services, including your name, email address, and transaction data extracted from your receipts.

2. Data Usage
Your data is used solely for managing your expenses, providing AI-powered insights, and improving our application. We do not sell or lease your personal information to third parties.

3. Data Security
We use industry-standard encryption and secure cloud infrastructure (AWS and Supabase) to protect your data from unauthorized access, loss, or misuse.

4. No Data Sharing
We do NOT share your personal data, transaction history, or receipt images with any third-party marketing or advertising agencies.

5. Your Rights
You have the right to access, update, or delete your personal information at any time through the Profile settings.

---

Terms of Service

1. Subscriptions
Expense Manager provides premium features via auto-renewing subscriptions (Monthly $3.99 or Yearly $34.99) and a Lifetime unlock ($79.99). A 14-day free trial is automatically issued upon account creation. At the end of the trial, access to premium features (Receipt Scanning, Reports, and Visualization) will be restricted until a subscription is purchased.

2. Apple Subscriptions
Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings directly on the App Store after purchase.

By using Expense Manager, you agree to these Terms and Privacy Policy.
`;

export default function HomeScreen() {
  const { session, isPremium, trialDaysLeft, isLoading } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [trendExpenses, setTrendExpenses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSupportVisible, setIsSupportVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isPrivacyVisible, setIsPrivacyVisible] = useState(false);
  const [isSubscriptionVisible, setIsSubscriptionVisible] = useState(false);
  const [isVisualizeVisible, setIsVisualizeVisible] = useState(false);
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', email: '', avatar: '' });
  const [otpCode, setOtpCode] = useState('');
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isMainLoading, setIsMainLoading] = useState(false);

  // Currency State
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [currenciesList, setCurrenciesList] = useState<Currency[]>([]);
  const [isCurrencyPickerVisible, setIsCurrencyPickerVisible] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  // Reports Sheet State
  const [isReportsVisible, setIsReportsVisible] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('all');
  const [reportExpenses, setReportExpenses] = useState<any[]>([]);
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportCategoryId, setReportCategoryId] = useState<string | null>(null);
  const [reportStoreName, setReportStoreName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showItems, setShowItems] = useState(false);

  // Details Modal State
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({
    storeName: '', amount: '0', date: '', categoryId: null, tag: '', items: [], tax: '0',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();

    initNotifications().then(() => registerForNotifications());

    getUserCurrency().then(curr => {
      if (curr) setSelectedCurrency(curr);
    });
    fetchCurrencies().then(list => {
      if (list && list.length > 0) setCurrenciesList(list);
    });
  }, []);

  // Load expenses when session or selected month changes
  useEffect(() => {
    if (session?.access_token) {
      loadExpenses();
    }
  }, [session, selectedMonth]);

  // Load categories once on sign-in; show paywall only after RC has finished loading
  useEffect(() => {
    if (session?.access_token) {
      loadCategories();
    }
  }, [session]);

  // Auto-paywall: only fire after isLoading=false so we have the real premium state
  useEffect(() => {
    if (!isLoading && !isPremium && trialDaysLeft <= 0 && session?.access_token) {
      setIsSubscriptionVisible(true);
    }
  }, [isLoading, isPremium, trialDaysLeft, session]);

  // Load last-6-months data for trend chart (independent of month filter)
  useEffect(() => {
    if (isVisualizeVisible && session?.access_token) {
      loadTrendExpenses();
    }
  }, [isVisualizeVisible, session?.access_token]);

  const safelySwitchModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowSettings(false);
    setTimeout(() => {
      setter(true);
    }, 400); // 400ms delay perfectly bypasses iOS silent modal conflict
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (e: any) {
      console.warn('Failed to load categories:', e?.message);
    }
  };

  useEffect(() => {
    if (isReportsVisible) loadReportData();
  }, [isReportsVisible, reportPeriod, reportCategoryId, reportStoreName]);

  const loadExpenses = async (opts?: { isRefresh?: boolean }) => {
    const isRefresh = !!opts?.isRefresh;
    if (isRefresh) setRefreshing(true);
    else setIsMainLoading(true);
    if (!isRefresh) setExpenses([]);
    try {
      let from: string | undefined;
      let to: string | undefined;

      if (selectedMonth !== 'all') {
        const monthIndex = MONTH_KEYS.indexOf(selectedMonth) - 1;
        const year = new Date().getFullYear();
        ({ from, to } = monthRange(year, monthIndex));
      }

      const data = await fetchExpenses(session?.access_token || '', { from, to });
      setExpenses(data);

      // Auto-adopt expense currency if user has not explicitly configured a currency preference
      if (data && data.length > 0) {
        hasUserSetCurrency().then(hasSet => {
          if (!hasSet) {
            const firstCur = data[0].currency;
            if (firstCur && firstCur !== selectedCurrency) {
              setSelectedCurrency(firstCur);
              setUserCurrency(firstCur);
            }
          }
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load expenses');
    } finally {
      setIsMainLoading(false);
      setRefreshing(false);
    }
  };

  const loadTrendExpenses = async () => {
    try {
      const d = new Date();
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      const data = await fetchExpenses(session?.access_token || '', {
        from: toLocalDateString(d),
      });
      setTrendExpenses(data);
    } catch (err: any) {
      console.warn('Failed to load trend data:', err?.message);
    }
  };

  const loadReportData = async () => {
    setIsReportLoading(true);
    try {
      let from: string | undefined;
      let to: string | undefined;
      const today = new Date();

      if (reportPeriod === '3m') {
        const d = new Date(); d.setMonth(d.getMonth() - 2);
        d.setDate(1); from = toLocalDateString(d);
      } else if (reportPeriod === '6m') {
        const d = new Date(); d.setMonth(d.getMonth() - 5);
        d.setDate(1); from = toLocalDateString(d);
      } else if (reportPeriod === 'year') {
        from = `${today.getFullYear()}-01-01`;
      } else if (reportPeriod === 'custom') {
        from = customRange.from || undefined; to = customRange.to || undefined;
      }

      const data = await fetchExpenses(session?.access_token || '', {
        from,
        to,
        categoryId: reportCategoryId || undefined,
        storeName: reportStoreName || undefined
      });
      setReportExpenses(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load reports');
      setReportExpenses([]);
    } finally {
      setIsReportLoading(false);
    }
  };

  const processReceipt = async (base64: string | null | undefined, mimeType: string | undefined) => {
    if (!base64) return;
    setScanning(true);

    const backendUrl = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
    console.log(`\n========== [SCAN] Starting Receipt Scan ==========`);
    console.log(`[SCAN] Backend URL: ${backendUrl}`);
    console.log(`[SCAN] MIME type: ${mimeType}`);
    console.log(`[SCAN] Image base64 length: ${base64?.length ?? 0} chars`);
    console.log(`[SCAN] User token present: ${!!session?.access_token}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[SCAN] ⏱️ Request timed out after 60 seconds — aborting.');
        controller.abort();
      }, 60000);

      console.log(`[SCAN] Sending POST to ${backendUrl}/api/scan-receipt ...`);
      const startTime = Date.now();

      const resp = await fetch(`${backendUrl}/api/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ imageBase64: base64, mimeType, targetCurrency: selectedCurrency }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[SCAN] Response received in ${elapsed}s — HTTP ${resp.status}`);

      const result = await resp.json();
      console.log(`[SCAN] Response body:`, JSON.stringify(result, null, 2));

      if (!resp.ok) {
        console.error(`[SCAN] ❌ Backend returned error: ${result.error}`);
        if (resp.status === 402 || result.code === 'PREMIUM_REQUIRED') {
          setIsSubscriptionVisible(true);
          throw new Error(result.error || 'Premium subscription required');
        }
        throw new Error(result.error || 'Failed');
      }

      console.log(`[SCAN] ✅ Success! Store: ${result.scanResult?.storeName}, Amount: ${result.scanResult?.totalAmount}`);

      await notifyExpenseLogged(result.scanResult?.storeName);

      await loadExpenses();
      Alert.alert('Success', `Added from ${result.scanResult?.storeName}`);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.error(`[SCAN] ❌ TIMEOUT — Could not reach backend at ${process.env.EXPO_PUBLIC_BACKEND_URL}`);
        Alert.alert('Connection Timeout', 'The server took too long to respond. Please check your internet connection and try again.');
      } else {
        console.error(`[SCAN] ❌ Error:`, e.message, e);
        Alert.alert('Scan Error', e.message);
      }
    }
    finally {
      console.log(`[SCAN] ========== Scan Finished ==========\n`);
      setScanning(false);
    }
  };

  const handlePressTransaction = async (expense: any) => {
    setSelectedExpense(expense);
    setEditedData({
      storeName: expense.store_name || '',
      amount: String(toAmount(expense.amount)),
      currency: expense.currency || 'USD',
      date: expense.date,
      categoryId: expense.category_id,
      items: expense.expense_items ? [...expense.expense_items] : [],
      tax: String(toAmount(expense.tax)),
    });

    setReceiptUrl(null);
    setIsEditing(false);
    setShowItems(false);
    setIsDetailModalVisible(true);
    if (expense.receipt_image_key) {
      try { const url = await getReceiptUrl(session?.access_token || '', expense.id); setReceiptUrl(url); } catch (e) { }
    }
  };

  const performDelete = async () => {
    try {
      await deleteExpense(session?.access_token || '', selectedExpense.id);
      setIsDetailModalVisible(false);
      loadExpenses();
      if (isReportsVisible) loadReportData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleAddManual = () => {
    setSelectedExpense(null);
    setEditedData({
      storeName: '',
      amount: '',
      currency: selectedCurrency || 'USD',
      date: toLocalDateString(new Date()),
      categoryId: categories.length > 0 ? categories[0].id : null,
      items: [],
      tax: '0',
    });
    setIsEditing(true);
    setShowItems(false);
    setIsDetailModalVisible(true);
  };

  const performUpdate = async () => {
    try {
      const total = editedData.items.reduce((acc: any, i: any) => acc + (i.price * i.quantity), 0);
      const amt = total > 0 ? total : parseFloat(editedData.amount || '0');

      if (selectedExpense) {
        // Update existing
        await updateExpense(session?.access_token || '', selectedExpense.id, {
          ...editedData,
          amount: amt,
          tax: parseFloat(editedData.tax || '0'),
        });
      } else {
        // Create new
        await createExpense(session?.access_token || '', {
          ...editedData,
          amount: amt,
          currency: editedData.currency || selectedCurrency || 'USD',
          tax: parseFloat(editedData.tax || '0'),
          userId: session?.user?.id || '',
        });
      }

      setIsEditing(false); loadExpenses(); setIsDetailModalVisible(false);
      if (isReportsVisible) loadReportData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const faqItems = [
    { q: t('faqs.q1'), a: t('faqs.a1') },
    { q: t('faqs.q2'), a: t('faqs.a2') },
    { q: t('faqs.q3'), a: t('faqs.a3') },
    { q: t('faqs.q4'), a: t('faqs.a4') },
    { q: t('faqs.q5'), a: t('faqs.a5') },
    { q: t('faqs.q6'), a: t('faqs.a6') },
    { q: t('faqs.q7'), a: t('faqs.a7') },
    { q: t('faqs.q8'), a: t('faqs.a8') },
    { q: t('faqs.q9'), a: t('faqs.a9') },
    { q: t('faqs.q10'), a: t('faqs.a10') }
  ];

  const handleSupportSubmit = async () => {
    if (!supportForm.subject || !supportForm.message) return Alert.alert('Error', 'Please fill all fields');
    setIsSubmittingSupport(true);
    try {
      await submitSupport(session?.access_token || '', supportForm);
      Alert.alert('Success', 'Support message sent!');
      setSupportForm({ subject: '', message: '' });
      setIsSupportVisible(false);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setIsSubmittingSupport(false); }
  };

  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata || {};
      if (meta.currency_preference) {
        setSelectedCurrency(meta.currency_preference);
        setUserCurrency(meta.currency_preference);
      }
      setProfileForm(prev => ({
        ...prev,
        firstName: meta.first_name || prev.firstName,
        lastName: meta.last_name || prev.lastName,
        phone: meta.phone || prev.phone,
        email: session.user.email || prev.email,
        avatar: meta.avatar_url || prev.avatar,
      }));
      supabase
        .from('profiles')
        .select('first_name, last_name, phone, currency_preference')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(
          ({ data }) => {
            if (data) {
              setProfileForm(prev => ({
                ...prev,
                firstName: data.first_name || prev.firstName,
                lastName: data.last_name || prev.lastName,
                phone: data.phone || prev.phone,
              }));
              if (data.currency_preference) {
                setSelectedCurrency(data.currency_preference);
                setUserCurrency(data.currency_preference);
              }
            }
          },
          () => {}
        );
    }
  }, [session]);

  const openProfile = async () => {
    const meta = session?.user?.user_metadata || {};
    let firstName = meta.first_name || '';
    let lastName = meta.last_name || '';
    let phone = meta.phone || '';
    let email = session?.user?.email || '';
    let avatar = meta.avatar_url || '';

    setProfileForm({ firstName, lastName, phone, email, avatar });
    setIsProfileVisible(true);

    if (session?.user?.id) {
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, currency_preference')
          .eq('id', session.user.id)
          .maybeSingle();

        if (dbProfile) {
          setProfileForm(prev => ({
            ...prev,
            firstName: dbProfile.first_name || prev.firstName,
            lastName: dbProfile.last_name || prev.lastName,
            phone: dbProfile.phone || prev.phone,
          }));
          if (dbProfile.currency_preference) {
            setSelectedCurrency(dbProfile.currency_preference);
            setUserCurrency(dbProfile.currency_preference);
          }
        }
      } catch (err) {
        console.warn('Error fetching profile:', err);
      }
    }
  };

  const handleSelectCurrency = async (curr: Currency) => {
    setSelectedCurrency(curr.code);
    setIsCurrencyPickerVisible(false);
    setCurrencySearchQuery('');
    await setUserCurrency(curr.code);
    if (session?.user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ currency_preference: curr.code })
          .eq('id', session.user.id);
        await supabase.auth.updateUser({
          data: { currency_preference: curr.code }
        });
      } catch (e: any) {
        console.warn('Failed to save currency preference to profile:', e?.message);
      }
    }
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!res.canceled && res.assets[0].base64) {
      try {
        setIsUpdatingProfile(true);
        const upload = await uploadProfilePicture(session?.access_token || '', res.assets[0].base64, res.assets[0].mimeType);
        setProfileForm({ ...profileForm, avatar: upload.url });
        Alert.alert('Success', 'Profile picture updated locally. Save to confirm.');
      } catch (e: any) { Alert.alert('Error', e.message); }
      finally { setIsUpdatingProfile(false); }
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const emailChanged = profileForm.email !== session?.user?.email;

      const { error } = await supabase.auth.updateUser({
        email: emailChanged ? profileForm.email : undefined,
        data: {
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          phone: profileForm.phone,
          avatar_url: profileForm.avatar
        }
      });
      if (error) throw error;

      if (emailChanged) {
        setIsOtpVisible(true);
        Alert.alert('Verification', 'Please enter the OTP sent to your new email.');
      } else {
        Alert.alert('Success', 'Profile updated!');
        setIsProfileVisible(false);
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setIsUpdatingProfile(false); }
  };

  const verifyOtp = async () => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: profileForm.email,
        token: otpCode,
        type: 'email_change'
      });
      if (error) throw error;
      Alert.alert('Email Updated', 'Your email address has been changed successfully.');
      setIsOtpVisible(false);
      setIsProfileVisible(false);
    } catch (e: any) { Alert.alert(t('common.error'), e.message); }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportExpensesExcel(session?.access_token || '', {
        from: customRange.from || undefined,
        to: customRange.to || undefined,
        categoryId: reportCategoryId || undefined
      });
      Alert.alert('Success', 'Excel report downloaded and shared!');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setIsExporting(false); }
  };

  const getCategoryStats = () => {
    const stats: { [key: string]: { amount: number; name: string; color: string } } = {};
    expenses.forEach(exp => {
      const catId = exp.categories?.id || 'other';
      if (!stats[catId]) {
        stats[catId] = { amount: 0, name: exp.categories?.name || 'Other', color: exp.categories?.color || '#3b82f6' };
      }
      stats[catId].amount += toAmount(exp.amount);
    });
    return Object.values(stats).sort((a, b) => b.amount - a.amount);
  };

  const getMonthlyTrendData = () => {
    const data: any[] = [];
    const now = new Date();
    const source = trendExpenses.length > 0 ? trendExpenses : expenses;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });

      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const mTotal = source.reduce((s, e) => {
        const ed = new Date(e.date + 'T12:00:00');
        return (ed >= mStart && ed <= mEnd && !e.is_income) ? s + toAmount(e.amount) : s;
      }, 0);

      data.push({ value: mTotal, label: label });
    }
    return data;
  };

  const getAdvancedStats = () => {
    const spending = expenses.filter(e => !e.is_income);
    const total = spending.reduce((s, e) => s + toAmount(e.amount), 0);
    let days = 1;
    if (spending.length > 1) {
      const timestamps = spending.map(e => new Date(e.date + 'T12:00:00').getTime());
      const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
      days = Math.max(1, Math.round(spanMs / (1000 * 60 * 60 * 24)) + 1);
    }
    const avg = spending.length > 0 ? total / days : 0;
    const topCat = getCategoryStats()[0]?.name || 'N/A';
    return { avg, topCat };
  };

  const isLocked = !isPremium && trialDaysLeft <= 0;

  const handlePremiumFeature = (action: () => void) => {
    if (isLocked) {
      setIsSubscriptionVisible(true);
    } else {
      action();
    }
  };

  const handleScanPress = () => {
    if (scanning) return;
    Alert.alert('Scan', 'Choose source', [
      {
        text: 'Camera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to scan receipts. Please enable it in Settings.');
            return;
          }
          const res = await ImagePicker.launchCameraAsync({ base64: true });
          if (!res.canceled) processReceipt(res.assets[0].base64, res.assets[0].mimeType);
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Photo library access is needed to import receipts. Please enable it in Settings.');
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true });
          if (!res.canceled) processReceipt(res.assets[0].base64, res.assets[0].mimeType);
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const totalSpend = expenses.reduce((acc, c) => {
    if (c.is_income) return acc;
    const amt = toAmount(c.amount);
    const cCur = c.currency || selectedCurrency;
    return acc + convertCurrencyLocally(amt, cCur, selectedCurrency);
  }, 0);
  const reportTotal = reportExpenses.reduce((acc, c) => {
    if (c.is_income) return acc;
    const amt = toAmount(c.amount);
    const cCur = c.currency || selectedCurrency;
    return acc + convertCurrencyLocally(amt, cCur, selectedCurrency);
  }, 0);
  const paywallForced = !isPremium && trialDaysLeft <= 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBackground, { backgroundColor: isDark ? theme.background : '#eee' }]}>
        <View style={[styles.blobPurple, { backgroundColor: theme.blob1 }]} />
        <View style={[styles.blobTeal, { backgroundColor: theme.blob2 }]} />
        <View style={[styles.blobLight, { backgroundColor: theme.blob3 }]} />
        <BlurView intensity={isDark ? 70 : 40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadExpenses({ isRefresh: true })} tintColor="#fff" />}
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={openProfile}>
              {session?.user?.user_metadata?.avatar_url ? (
                <Image source={{ uri: session.user.user_metadata.avatar_url }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{session?.user?.user_metadata?.first_name?.[0] || 'U'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={[styles.welcomeText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>{t('common.welcome')}</Text>
              <Text style={[styles.nameText, { color: theme.text }]}>
                {`${session?.user?.user_metadata?.first_name || ''} ${session?.user?.user_metadata?.last_name || ''}`.trim() || 'User'}
              </Text>
              {!isPremium && trialDaysLeft > 0 && (
                <View style={styles.trialBadge}>
                  <Ionicons name="time-outline" size={12} color="#8b5cf6" />
                  <Text style={styles.trialBadgeText}>{trialDaysLeft} days trial left</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={[styles.settingsBtn, { backgroundColor: theme.card }]}><Ionicons name="settings-outline" size={24} color={theme.text} /></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthSelector}>
          {MONTH_KEYS.map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonth(m)}
              style={[
                styles.monthItem,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
                selectedMonth === m && {
                  backgroundColor: isDark ? '#fff' : '#0f172a',
                  borderColor: isDark ? '#fff' : '#0f172a',
                }
              ]}
            >
              <Text
                style={[
                  styles.monthText,
                  { color: isDark ? '#a1a1aa' : '#64748b' },
                  selectedMonth === m && { color: isDark ? '#09090b' : '#ffffff', fontWeight: '700' }
                ]}
              >
                {t(`months.${m}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }]}>
              {selectedMonth === 'all' ? t('home.total_balance') : `${t(`months.${selectedMonth}`)} ${t('home.spending')}`}
            </Text>
            <TouchableOpacity
              style={[styles.currencyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}
              onPress={() => setIsCurrencyPickerVisible(true)}
            >
              <Ionicons name="cash-outline" size={13} color="#10b981" />
              <Text style={[styles.currencyPillText, { color: theme.text }]}>{selectedCurrency}</Text>
              <Ionicons name="chevron-down" size={11} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{currencySymbol} {formatMoney(totalSpend)}</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[
              styles.actionSquare,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              },
              isLocked && { opacity: 0.6 }
            ]}
            onPress={() => handlePremiumFeature(handleScanPress)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              {isLocked ? <Ionicons name="lock-closed" size={14} color="#f87171" /> : <Ionicons name="camera" size={14} color={theme.text} />}
            </View>
            <Text style={[styles.actionSmallText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }]}>{t('common.all')}</Text>
            <Text style={[styles.actionBigText, { color: theme.text }]}>{t('home.scan_receipt')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionSquare,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              },
              isLocked && { opacity: 0.6 }
            ]}
            onPress={() => handlePremiumFeature(() => setIsReportsVisible(true))}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
               {isLocked ? <Ionicons name="lock-closed" size={14} color="#f87171" /> : <MaterialCommunityIcons name="file-chart" size={14} color={theme.text} />}
            </View>
            <Text style={[styles.actionSmallText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }]}>{t('common.all')}</Text>
            <Text style={[styles.actionBigText, { color: theme.text }]}>{t('home.view_reports')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionSquare,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              }
            ]}
            onPress={handleAddManual}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="add" size={16} color={theme.text} />
            </View>
            <Text style={[styles.actionSmallText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }]}>{t('common.all')}</Text>
            <Text style={[styles.actionBigText, { color: theme.text }]}>{t('home.add_manual')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.actionGrid, { marginTop: -15 }]}>
          <TouchableOpacity
            style={[
              styles.actionSquare,
              {
                width: '100%',
                height: 48,
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                aspectRatio: undefined,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              },
              isLocked && { opacity: 0.6 }
            ]}
            onPress={() => handlePremiumFeature(() => setIsVisualizeVisible(true))}
          >
            {isLocked ? (
               <Ionicons name="lock-closed" size={18} color="#f87171" style={{ marginRight: 10 }} />
            ) : (
               <Ionicons name="pie-chart" size={18} color="#8b5cf6" style={{ marginRight: 10 }} />
            )}
            <Text style={[styles.actionBigText, { marginTop: 0, color: theme.text }]}>{t('home.visualize')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('home.transactions')}</Text>
          {isMainLoading && <ActivityIndicator color={theme.button} style={{ marginLeft: 10 }} />}
        </View>

        {isMainLoading ? (
          <View style={styles.emptyContainer}><ActivityIndicator color="#3b82f6" size="large" /></View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('home.no_transactions')}</Text></View>
        ) : (
          expenses.map((e) => (
            <TouchableOpacity key={e.id} style={styles.txCard} onPress={() => handlePressTransaction(e)}>
              <BlurView intensity={isDark ? 30 : 100} tint={isDark ? "light" : "default"} style={[styles.txBlur, { backgroundColor: theme.card }]}>
                <View style={[styles.txIcon, { backgroundColor: (e.categories?.color || '#3b82f6') + '25' }]}>
                  <Ionicons name={(e.categories?.icon || 'card') as any} size={20} color={e.categories?.color || (isDark ? "#fff" : theme.text)} />
                </View>
                <View style={styles.txContent}>
                  <View style={styles.txTopRow}>
                    <Text style={[styles.txStore, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                      {e.store_name || 'N/A'}
                    </Text>
                    <Text style={[styles.txAmount, { color: theme.text }]}>
                      {getCurrencySymbol(e.currency || selectedCurrency)} {formatMoney(e.amount)}
                    </Text>
                  </View>
                  <View style={styles.txBottomRow}>
                    <Text style={[styles.txDate, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
                      {new Date(e.date).toLocaleDateString()}
                    </Text>
                    {e.categories?.name && (
                      <Text style={[styles.txCategoryTag, { color: e.categories?.color || theme.textDim }]}>
                        {e.categories.name}
                      </Text>
                    )}
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Profile Modal */}
      <Modal visible={isProfileVisible} animationType="slide" transparent>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Profile</Text>
              <TouchableOpacity onPress={() => setIsProfileVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <TouchableOpacity onPress={pickAvatar} style={styles.avatarEditContainer}>
                  {profileForm.avatar ? (
                    <Image source={{ uri: profileForm.avatar }} style={styles.largeAvatar} />
                  ) : (
                    <View style={[styles.largeAvatar, { backgroundColor: theme.button, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>{profileForm.firstName?.[0] || 'U'}</Text>
                    </View>
                  )}
                  <View style={styles.editIconBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
                </TouchableOpacity>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: 13, marginTop: 12 }}>Tap to change photo</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.editLabel, { color: isDark ? '#a1a1aa' : '#64748b' }]}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#18181b' : '#f8fafc',
                      color: theme.text,
                      borderColor: isDark ? '#27272a' : '#e2e8f0',
                    },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={profileForm.firstName}
                  onChangeText={t => setProfileForm({ ...profileForm, firstName: t })}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.editLabel, { color: isDark ? '#a1a1aa' : '#64748b' }]}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#18181b' : '#f8fafc',
                      color: theme.text,
                      borderColor: isDark ? '#27272a' : '#e2e8f0',
                    },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={profileForm.lastName}
                  onChangeText={t => setProfileForm({ ...profileForm, lastName: t })}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.editLabel, { color: isDark ? '#a1a1aa' : '#64748b' }]}>Phone</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#18181b' : '#f8fafc',
                      color: theme.text,
                      borderColor: isDark ? '#27272a' : '#e2e8f0',
                    },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={profileForm.phone}
                  keyboardType="phone-pad"
                  onChangeText={t => setProfileForm({ ...profileForm, phone: t })}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.editLabel, { color: isDark ? '#a1a1aa' : '#64748b' }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#18181b' : '#f8fafc',
                      color: theme.text,
                      borderColor: isDark ? '#27272a' : '#e2e8f0',
                    },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                  ]}
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={profileForm.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={t => setProfileForm({ ...profileForm, email: t })}
                />
              </View>

              <View style={styles.profileTabs}>
                <TouchableOpacity style={[styles.profileTabItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setIsSubscriptionVisible(true)}>
                  <View style={[styles.profileTabIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}><Ionicons name="card-outline" size={20} color="#3b82f6" /></View>
                  <Text style={[styles.profileTabText, { color: theme.text }]}>Subscriptions</Text>
                  <Ionicons name="chevron-forward" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.profileTabItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setIsCurrencyPickerVisible(true)}>
                  <View style={[styles.profileTabIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}><Ionicons name="cash-outline" size={20} color="#10b981" /></View>
                  <Text style={[styles.profileTabText, { color: theme.text }]}>Currency</Text>
                  <Text style={{ color: '#10b981', fontWeight: '700', marginRight: 8 }}>{currencySymbol} {selectedCurrency}</Text>
                  <Ionicons name="chevron-forward" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.profileTabItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://expense.alpha-devs.cloud/privacy/')}>
                  <View style={[styles.profileTabIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}><Ionicons name="shield-checkmark-outline" size={20} color="#3b82f6" /></View>
                  <Text style={[styles.profileTabText, { color: theme.text }]}>{t('profile.privacy')}</Text>
                  <Ionicons name="open-outline" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.profileTabItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={toggleLanguage}>
                  <View style={[styles.profileTabIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}><Ionicons name="language-outline" size={20} color="#f59e0b" /></View>
                  <Text style={[styles.profileTabText, { color: theme.text }]}>{t('profile.language')}</Text>
                  <Text style={{ color: '#f59e0b', fontWeight: '700', marginRight: 8 }}>{i18n.language === 'en' ? 'English' : '中文'}</Text>
                  <Ionicons name="swap-horizontal" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.profileTabItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={toggleTheme}>
                  <View style={[styles.profileTabIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}><Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={isDark ? "#8b5cf6" : "#3b82f6"} /></View>
                  <Text style={[styles.profileTabText, { color: theme.text }]}>{isDark ? 'Night Mode' : 'Day Mode'}</Text>
                  <Ionicons name="repeat-outline" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.saveBtnProfessional, isUpdatingProfile && { opacity: 0.7 }]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.saveBtnProfessionalText}>Save Changes</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Subscriptions Modal Overlay */}
      <Modal
        visible={isSubscriptionVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Block hardware back while locked; purchase/restore still call onClose
          if (!paywallForced) setIsSubscriptionVisible(false);
        }}
      >
        <PaywallScreen
          onClose={() => setIsSubscriptionVisible(false)}
          isForced={paywallForced}
        />
      </Modal>

        {/* Privacy Policy Modal Overlay */}
        <Modal visible={isPrivacyVisible} transparent animationType="slide">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Privacy & Terms</Text>
                <TouchableOpacity onPress={() => setIsPrivacyVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding: 24 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3b82f6',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 20,
                    gap: 8,
                  }}
                  onPress={() => Linking.openURL('https://expense.alpha-devs.cloud/privacy/')}
                >
                  <Ionicons name="globe-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Open Full Privacy Policy Online</Text>
                  <Ionicons name="open-outline" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={[styles.policyText, { color: theme.text }]}>{PRIVACY_POLICY}</Text>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        {/* OTP Verification Overlay */}
        <Modal visible={isOtpVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.supportForm, { width: '90%', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.modalTitle, { fontSize: 20, marginBottom: 10, color: theme.text }]}>Confirm Email Change</Text>
              <Text style={{ color: theme.textDim, marginBottom: 20 }}>Enter the verification code sent to {profileForm.email}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#18181b' : '#f8fafc',
                    color: theme.text,
                    borderColor: isDark ? '#27272a' : '#e2e8f0',
                    letterSpacing: 8,
                    textAlign: 'center',
                    fontSize: 20
                  }
                ]}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={theme.textDim}
              />
              <TouchableOpacity style={[styles.saveBtn, { marginTop: 20, height: 50, borderRadius: 12, backgroundColor: theme.button }]} onPress={verifyOtp}>
                <Text style={styles.saveBtnText}>Verify OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }} onPress={() => setIsOtpVisible(false)}><Text style={{ color: theme.textDim }}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

      {/* Customer Support Modal */}
      <Modal visible={isSupportVisible} animationType="slide" transparent>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Customer Support</Text>
              <TouchableOpacity onPress={() => setIsSupportVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 20, color: theme.text }]}>{t('support.faq')}</Text>
              {faqItems.map((f, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.faqItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <View style={styles.faqRow}>
                    <Text style={[styles.faqQuestion, { color: theme.text }]}>{f.q}</Text>
                    <Ionicons name={expandedFaq === idx ? "chevron-up" : "chevron-down"} size={16} color={theme.textDim} />
                  </View>
                  {expandedFaq === idx && <Text style={[styles.faqAnswer, { color: theme.textDim }]}>{f.a}</Text>}
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionTitle, { marginTop: 40, marginBottom: 20, color: theme.text }]}>{t('support.send')}</Text>
              <View style={[styles.supportForm, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.supportFormHeader}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
                  <Text style={[styles.supportFormTitle, { color: theme.text }]}>Send us a Message</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('support.subject')}</Text>
                  <TextInput
                    style={[
                      styles.supportInput,
                      {
                        backgroundColor: isDark ? '#18181b' : '#f8fafc',
                        borderColor: isDark ? '#27272a' : '#e2e8f0',
                        color: theme.text
                      }
                    ]}
                    value={supportForm.subject}
                    onChangeText={s => setSupportForm({ ...supportForm, subject: s })}
                    placeholder={t('support.subject')}
                    placeholderTextColor={theme.textDim}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('support.message')}</Text>
                  <TextInput
                    style={[
                      styles.supportInput,
                      {
                        backgroundColor: isDark ? '#18181b' : '#f8fafc',
                        borderColor: isDark ? '#27272a' : '#e2e8f0',
                        color: theme.text,
                        height: 120,
                        textAlignVertical: 'top'
                      }
                    ]}
                    value={supportForm.message}
                    onChangeText={m => setSupportForm({ ...supportForm, message: m })}
                    placeholder={t('support.message')}
                    placeholderTextColor={theme.textDim}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={[styles.supportSubmitBtn, { backgroundColor: theme.button }, isSubmittingSupport && { opacity: 0.7 }]}
                  onPress={handleSupportSubmit}
                  disabled={isSubmittingSupport}
                >
                  {isSubmittingSupport ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.supportSubmitText}>{t('support.send')}</Text>
                      <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Visualization Modal */}
      <Modal visible={isVisualizeVisible} animationType="slide" transparent>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Visualize Spendings</Text>
              <TouchableOpacity onPress={() => setIsVisualizeVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={styles.chartTitleContainer}>
                <Text style={[styles.visualCardTitle, { color: theme.text }]}>Monthly Spending Trend</Text>
                <Text style={[styles.chartSubtitle, { color: theme.textDim }]}>Last 6 Months</Text>
              </View>

              <View style={[styles.chartWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {expenses.length > 0 ? (
                  <LineChart
                    areaChart
                    curved
                    data={getMonthlyTrendData()}
                    width={width - 120}
                    height={180}
                    spacing={(width - 160) / 5}
                    initialSpacing={20}
                    color="#8b5cf6"
                    thickness={3}
                    startFillColor="rgba(139, 92, 246, 0.3)"
                    endFillColor="rgba(6, 182, 212, 0.05)"
                    startOpacity={0.4}
                    endOpacity={0.0}
                    noOfSections={4}
                    yAxisColor="transparent"
                    yAxisThickness={0}
                    rulesColor={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}
                    rulesType="solid"
                    xAxisColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                    pointerConfig={{
                      pointerStripHeight: 160,
                      pointerStripColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      pointerStripWidth: 2,
                      pointerColor: '#8b5cf6',
                      radius: 6,
                      pointerLabelComponent: (items: any) => {
                        return (
                          <View style={{ backgroundColor: isDark ? '#18181b' : '#ffffff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{currencySymbol}{formatMoney(items[0].value, 0)}</Text>
                          </View>
                        );
                      },
                    }}
                    yAxisTextStyle={{ color: theme.textDim, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: theme.textDim, fontSize: 10, textAlign: 'center' }}
                    yAxisLabelPrefix={currencySymbol}
                    hideDataPoints
                    rulesLength={width - 120}
                  />
                ) : (
                  <View style={styles.emptyChart}><Text style={{ color: theme.textDim }}>Insufficient data for trends</Text></View>
                )}
              </View>

              <View style={[styles.visualCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.visualCardTitle, { color: theme.text }]}>Spending by Category</Text>
                {getCategoryStats().length === 0 ? (
                  <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.textDim }}>No data available for the period</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.chartContainer}>
                      {getCategoryStats().slice(0, 5).map((stat, i) => (
                        <View key={i} style={styles.chartBarRow}>
                          <Text style={[styles.chartBarLabel, { color: theme.text }]}>{stat.name}</Text>
                          <View style={[styles.chartBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                            <View style={[styles.chartBarFill, { width: `${(stat.amount / getCategoryStats()[0].amount) * 100}%`, backgroundColor: stat.color }]} />
                          </View>
                          <Text style={[styles.chartBarValue, { color: theme.text }]}>{currencySymbol}{formatMoney(stat.amount, 0)}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.statsGrid}>
                      <View style={[styles.statsCard, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                        <Text style={[styles.statsValue, { color: theme.text }]}>{currencySymbol}{formatMoney(getAdvancedStats().avg, 0)}</Text>
                        <Text style={[styles.statsLabel, { color: theme.textDim }]}>Avg. Daily</Text>
                      </View>
                      <View style={[styles.statsCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <Text style={[styles.statsValue, { color: theme.text }]} numberOfLines={1}>{getAdvancedStats().topCat}</Text>
                        <Text style={[styles.statsLabel, { color: theme.textDim }]}>Top Category</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Reports Sheet Modal */}
      <Modal visible={isReportsVisible} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsReportsVisible(false)} />
          <View style={[styles.sheetContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetDrag, { backgroundColor: isDark ? '#27272a' : '#cbd5e1' }]} />
              <View style={styles.sheetTitleRow}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>{t('reports.title')}</Text>
                <TouchableOpacity onPress={() => setIsReportsVisible(false)}><Ionicons name="close-circle" size={28} color={theme.textDim} /></TouchableOpacity>
              </View>
            </View>

            <View style={styles.sheetFilterRow}>
              <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={16} color={theme.textDim} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search store..."
                  placeholderTextColor={theme.textDim}
                  value={reportStoreName}
                  onChangeText={setReportStoreName}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportCatBar}>
                <TouchableOpacity
                  onPress={() => setReportCategoryId(null)}
                  style={[styles.miniCatBtn, { backgroundColor: theme.card, borderColor: theme.border }, !reportCategoryId && styles.miniCatActive]}
                >
                  <Text style={[styles.miniCatText, { color: theme.textDim }, !reportCategoryId && { color: '#fff' }]}>All Categories</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setReportCategoryId(cat.id)}
                    style={[styles.miniCatBtn, { backgroundColor: theme.card, borderColor: theme.border }, reportCategoryId === cat.id && styles.miniCatActive, reportCategoryId === cat.id && { backgroundColor: cat.color + '40' }]}
                  >
                    <Ionicons name={cat.icon as any} size={12} color={cat.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.miniCatText, { color: theme.textDim }, reportCategoryId === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodBar}>
              {PERIOD_KEYS.map(p => (
                <TouchableOpacity key={p} onPress={() => setReportPeriod(p)} style={[styles.periodBtn, { backgroundColor: theme.card, borderColor: theme.border }, reportPeriod === p && styles.periodBtnActive]}>
                  <Text style={[styles.periodBtnText, { color: theme.textDim }, reportPeriod === p && styles.periodBtnTextActive]}>{t(`reports.periods.${p}`)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {reportPeriod === 'custom' && (
              <View style={[styles.customRangeRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput style={[styles.customInput, { color: theme.text, borderBottomColor: theme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textDim} value={customRange.from} onChangeText={t => setCustomRange({ ...customRange, from: t })} />
                <Text style={{ color: theme.text }}>to</Text>
                <TextInput style={[styles.customInput, { color: theme.text, borderBottomColor: theme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textDim} value={customRange.to} onChangeText={t => setCustomRange({ ...customRange, to: t })} />
                <TouchableOpacity onPress={loadReportData}><Ionicons name="search" size={24} color="#3b82f6" /></TouchableOpacity>
              </View>
            )}

            <View style={styles.reportStats}>
              <View style={[styles.reportStatItem, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={[styles.reportStatVal, { color: theme.text }]}>{currencySymbol} {formatMoney(reportTotal)}</Text><Text style={[styles.reportStatLab, { color: theme.textDim }]}>{t('reports.total_spend')}</Text></View>
              <View style={[styles.reportStatItem, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={[styles.reportStatVal, { color: theme.text }]}>{reportExpenses.length}</Text><Text style={[styles.reportStatLab, { color: theme.textDim }]}>{t('reports.receipts')}</Text></View>
            </View>

            <View style={[styles.excelTable, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.tableHeader, { backgroundColor: isDark ? '#18181b' : '#f1f5f9', borderBottomColor: theme.border }]}>
                <Text style={[styles.tableHeadText, { color: theme.textDim, flex: 1.2 }]}>DATE</Text>
                <Text style={[styles.tableHeadText, { color: theme.textDim, flex: 2.5 }]}>STORE</Text>
                <Text style={[styles.tableHeadText, { color: theme.textDim, flex: 1.3, textAlign: 'right' }]}>AMOUNT</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {isReportLoading ? <ActivityIndicator style={{ marginTop: 20 }} color="#3b82f6" /> :
                  reportExpenses.map((re, idx) => (
                    <TouchableOpacity key={re.id} onPress={() => handlePressTransaction(re)} style={[styles.tableRow, { borderBottomColor: theme.border }, idx % 2 === 0 && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                      <Text style={[styles.tableCell, { color: theme.textDim, flex: 1.2, fontSize: 11 }]}>{re.date.split('-').slice(1).join('/')}</Text>
                      <Text style={[styles.tableCell, { color: theme.text, flex: 2.5, fontWeight: '600' }]} numberOfLines={1}>{re.store_name || 'N/A'}</Text>
                      <Text style={[styles.tableCell, { flex: 1.3, textAlign: 'right', fontWeight: '800', color: theme.text }]}>{getCurrencySymbol(re.currency || selectedCurrency)}{formatMoney(re.amount)}</Text>
                    </TouchableOpacity>
                  ))}
                {reportExpenses.length === 0 && !isReportLoading && <Text style={[styles.noRepo, { color: theme.textDim }]}>No data for this period.</Text>}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.saveBtnProfessional, { marginTop: 20, backgroundColor: '#10b981', shadowColor: '#10b981' }, isExporting && { opacity: 0.7 }]}
              onPress={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.saveBtnProfessionalText}>Export to Excel</Text>
                  <Ionicons name="download-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal visible={isDetailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsDetailModalVisible(false)} />
          <View style={[styles.detailCard, { backgroundColor: theme.background }]}>
            <View style={styles.detailTop}>
              <Text style={[styles.detailTitle, { color: theme.textDim }]}>{isEditing ? t('manual_add.title_edit') : t('manual_add.transaction_detail')}</Text>
              <View style={styles.detailAct}>
                {!isEditing && (
                  <>
                    <TouchableOpacity onPress={() => setIsEditing(true)}><Feather name="edit" size={20} color={theme.text} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Delete', 'Confirm?', [{ text: 'No' }, { text: 'Yes', style: 'destructive', onPress: performDelete }])}><Ionicons name="trash-outline" size={22} color="#ff4b4b" /></TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('manual_add.store')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                    value={editedData.storeName}
                    onChangeText={t => setEditedData({ ...editedData, storeName: t })}
                    placeholder={t('manual_add.store')}
                    placeholderTextColor={theme.textDim}
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('manual_add.amount')}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                        value={editedData.amount}
                        keyboardType="numeric"
                        onChangeText={t => setEditedData({ ...editedData, amount: t })}
                        placeholder={t('manual_add.amount')}
                        placeholderTextColor={theme.textDim}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('manual_add.tax')}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                        value={editedData.tax}
                        keyboardType="numeric"
                        onChangeText={t => setEditedData({ ...editedData, tax: t })}
                        placeholder={t('manual_add.tax')}
                        placeholderTextColor={theme.textDim}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('manual_add.date')} (YYYY-MM-DD)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                      value={editedData.date}
                      onChangeText={t => setEditedData({ ...editedData, date: t })}
                      placeholder={t('manual_add.date')}
                      placeholderTextColor={theme.textDim}
                    />
                  </View>

                  <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('manual_add.category')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {categories.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setEditedData({ ...editedData, categoryId: c.id })}
                        style={[styles.miniCatBtn, { backgroundColor: theme.card, borderColor: theme.border }, editedData.categoryId === c.id && styles.miniCatActive]}
                      >
                        <Ionicons name={c.icon as any} size={14} color={c.color} style={{ marginRight: 8 }} />
                        <Text style={[styles.miniCatText, { color: theme.textDim }, editedData.categoryId === c.id && { color: '#fff' }]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.itemsHeader}>
                    <Text style={[styles.editLabel, { color: theme.textDim }]}>{t('manual_add.items')}</Text>
                    <TouchableOpacity style={styles.addItemBtn} onPress={() => setEditedData({ ...editedData, items: [...editedData.items, { name: '', quantity: 1, price: 0 }] })}>
                      <Ionicons name="add-circle" size={18} color={theme.button} /><Text style={[styles.addItemText, { color: theme.button }]}>{t('manual_add.add_item')}</Text>
                    </TouchableOpacity>
                  </View>

                  {editedData.items.map((item: any, idx: number) => (
                    <View key={idx} style={styles.itemEditRow}>
                      <TextInput
                        style={[styles.input, { flex: 2, marginRight: 5, backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                        value={item.name}
                        onChangeText={t => {
                          const newItems = [...editedData.items]; newItems[idx].name = t; setEditedData({ ...editedData, items: newItems });
                        }}
                        placeholder={t('manual_add.item_name')}
                        placeholderTextColor={theme.textDim}
                      />
                      <TextInput
                        style={[styles.input, { flex: 0.6, marginRight: 5, backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                        value={item.quantity.toString()}
                        keyboardType="numeric"
                        onChangeText={t => {
                          const newItems = [...editedData.items]; newItems[idx].quantity = parseInt(t) || 0; setEditedData({ ...editedData, items: newItems });
                        }}
                        placeholder={t('manual_add.qty')}
                        placeholderTextColor={theme.textDim}
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, backgroundColor: isDark ? '#18181b' : '#f8fafc', borderColor: theme.border, color: theme.text }]}
                        value={item.price.toString()}
                        keyboardType="numeric"
                        onChangeText={t => {
                          const newItems = [...editedData.items]; newItems[idx].price = parseFloat(t) || 0; setEditedData({ ...editedData, items: newItems });
                        }}
                        placeholder={t('manual_add.price')}
                        placeholderTextColor={theme.textDim}
                      />
                      <TouchableOpacity onPress={() => {
                        const newItems = editedData.items.filter((_: any, i: number) => i !== idx); setEditedData({ ...editedData, items: newItems });
                      }} style={{ marginLeft: 8 }}><Ionicons name="trash" size={20} color="#ff4b4b" /></TouchableOpacity>
                    </View>
                  ))}

                  <View style={styles.editBtns}>
                    <TouchableOpacity style={[styles.btn, styles.saveBtn, { backgroundColor: theme.button }]} onPress={performUpdate}><Text style={styles.btnText}>{t('profile.save_changes')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.canBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setIsEditing(false)}><Text style={[styles.btnText, { color: theme.text }]}>{t('common.cancel')}</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.bigAmt, { color: theme.text }]}>{getCurrencySymbol(selectedExpense?.currency || selectedCurrency)}{formatMoney(selectedExpense?.amount)}</Text>
                  <Text style={[styles.bigStore, { color: theme.textDim }]}>{selectedExpense?.store_name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.catBadge, { backgroundColor: (selectedExpense?.categories?.color || '#3b82f6') + '20' }]}>
                      <Ionicons name={(selectedExpense?.categories?.icon || 'card') as any} size={14} color={selectedExpense?.categories?.color || '#3b82f6'} />
                      <Text style={[styles.catBadgeText, { color: selectedExpense?.categories?.color || '#3b82f6' }]}>{selectedExpense?.categories?.name || 'Uncategorized'}</Text>
                    </View>
                    <Text style={[styles.detailDateText, { color: theme.textDim }]}>{selectedExpense?.date ? new Date(selectedExpense.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : ''}</Text>
                  </View>
                  {!showItems ? (
                    <TouchableOpacity style={[styles.viewDetailsBtn, { backgroundColor: theme.button + '20' }]} onPress={() => setShowItems(true)}>
                      <Text style={[styles.viewDetailsText, { color: theme.button }]}>{t('common.view_details')}</Text>
                      <Ionicons name="chevron-down" size={16} color={theme.button} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: '100%', alignItems: 'center' }}>
                      <TouchableOpacity style={[styles.viewDetailsBtn, { backgroundColor: theme.button + '20' }]} onPress={() => setShowItems(false)}>
                        <Text style={[styles.viewDetailsText, { color: theme.button }]}>{t('common.hide_details')}</Text>
                        <Ionicons name="chevron-up" size={16} color={theme.button} />
                      </TouchableOpacity>
                      {selectedExpense?.expense_items?.length > 0 && (
                        <View style={[styles.itemsList, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                          {(() => {
                            const grouped: any = {};
                            selectedExpense.expense_items.forEach((i: any) => {
                              const name = i.name.toUpperCase();
                              if (!grouped[name]) grouped[name] = { ...i, quantity: 0, price: 0 };
                              grouped[name].quantity += (i.quantity || 1);
                              grouped[name].price = i.price; // Keep price per item
                            });
                            return Object.values(grouped).map((item: any) => (
                              <View key={item.id} style={styles.itemRow}>
                                <Text style={[styles.itemName, { color: theme.textDim }]}>{item.name} x{item.quantity}</Text>
                                <Text style={[styles.itemPrice, { color: theme.text }]}>{getCurrencySymbol(selectedExpense?.currency || selectedCurrency)}{formatMoney(toAmount(item.price) * toAmount(item.quantity))}</Text>
                              </View>
                            ));
                          })()}
                          {selectedExpense?.tax > 0 && (
                            <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8, paddingTop: 8 }]}>
                              <Text style={[styles.itemName, { fontWeight: '700', color: theme.text }]}>TAX</Text>
                              <Text style={[styles.itemPrice, { fontWeight: '700', color: theme.text }]}>{getCurrencySymbol(selectedExpense?.currency || selectedCurrency)}{formatMoney(selectedExpense.tax)}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                  {selectedExpense?.receipt_image_key && (
                    <View style={[styles.receiptPrev, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                      {receiptUrl ? <Image source={{ uri: receiptUrl }} style={styles.receiptImg} resizeMode="contain" /> : <ActivityIndicator color="#3b82f6" />}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowSettings(false)} />
          <View style={[styles.settingsMenu, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
            
            {/* Subscription Status Block */}
            <View style={{ paddingBottom: 15, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Subscription Status</Text>
              {isPremium ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '700' }}>Premium Active</Text>
                </View>
              ) : trialDaysLeft > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time" size={16} color="#3b82f6" />
                  <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '700' }}>{trialDaysLeft} days trial remaining</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="alert-circle" size={16} color="#ff4b4b" />
                  <Text style={{ color: '#ff4b4b', fontSize: 13, fontWeight: '700' }}>Free Trial Expired</Text>
                </View>
              )}
              <TouchableOpacity
                style={{ marginTop: 12, backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' }}
                onPress={() => safelySwitchModal(setIsSubscriptionVisible)}
              >
                <Text style={{ color: '#8b5cf6', fontSize: 12, fontWeight: '700' }}>Manage Subscriptions</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowSettings(false); openProfile(); }}>
              <Ionicons name="person-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={isDark ? "#8b5cf6" : "#3b82f6"} />
              <Text style={[styles.menuText, { color: theme.text }]}>{isDark ? 'Switch to Day' : 'Switch to Night'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
              <Ionicons name="language-outline" size={20} color="#f59e0b" />
              <Text style={[styles.menuText, { color: theme.text }]}>{i18n.language === 'en' ? 'Switch to Chinese' : '切換為英文'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => safelySwitchModal(setIsCurrencyPickerVisible)}>
              <Ionicons name="cash-outline" size={20} color="#10b981" />
              <Text style={[styles.menuText, { color: theme.text }]}>Currency ({selectedCurrency})</Text>
              <Text style={{ marginLeft: 'auto', color: '#10b981', fontWeight: '700', fontSize: 13, marginRight: 4 }}>
                {currencySymbol}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => safelySwitchModal(setIsSupportVisible)}>
              <Ionicons name="headset-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Customer Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowSettings(false); Linking.openURL('https://expense.alpha-devs.cloud/privacy/'); }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Privacy & Terms</Text>
              <Ionicons name="open-outline" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <View style={{ height: 1.5, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginVertical: 5 }} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => supabase.auth.signOut()}>
              <Ionicons name="log-out-outline" size={20} color="#ff4b4b" />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={isCurrencyPickerVisible} transparent animationType="slide">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }]}>
          <View style={[styles.currencySheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.currencyHeader}>
                <Text style={[styles.currencyTitle, { color: theme.text }]}>Select Currency</Text>
                <TouchableOpacity onPress={() => { setIsCurrencyPickerVisible(false); setCurrencySearchQuery(''); }}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.currencySearchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.currencySearchInput, { color: theme.text }]}
                  placeholder="Search currency code or name..."
                  placeholderTextColor={theme.textDim}
                  value={currencySearchQuery}
                  onChangeText={setCurrencySearchQuery}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView style={{ flex: 1, marginTop: 12 }} keyboardShouldPersistTaps="handled">
                {currenciesList
                  .filter(c => {
                    if (!currencySearchQuery.trim()) return true;
                    const q = currencySearchQuery.toLowerCase();
                    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
                  })
                  .map(c => {
                    const isSelected = c.code === selectedCurrency;
                    return (
                      <TouchableOpacity
                        key={c.code}
                        style={[
                          styles.currencyRow,
                          {
                            backgroundColor: isSelected ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : theme.card,
                            borderColor: isSelected ? '#10b981' : theme.border,
                          },
                        ]}
                        onPress={() => handleSelectCurrency(c)}
                      >
                        <View style={[styles.currencySymbolBadge, { backgroundColor: isSelected ? '#10b981' : (isDark ? '#27272a' : '#e4e4e7') }]}>
                          <Text style={{ color: isSelected ? '#fff' : theme.text, fontWeight: '700', fontSize: 15 }}>
                            {c.symbol}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{c.code}</Text>
                          <Text style={{ color: theme.textDim, fontSize: 13, marginTop: 2 }}>{c.name}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Scanning Loader Modal */}
      <Modal visible={scanning} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loaderText}>Analyzing Receipt...</Text>
            <Text style={styles.loaderSubText}>This may take a few seconds</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  topBackground: { ...StyleSheet.absoluteFillObject, height: TOP_SECTION_HEIGHT, overflow: 'hidden' },
  blobPurple: { position: 'absolute', width: width, height: width, borderRadius: width / 2, backgroundColor: '#4c1d95', top: -width / 2, left: -width / 4, opacity: 0.6 },
  blobTeal: { position: 'absolute', width: width, height: width, borderRadius: width / 2, backgroundColor: '#134e4a', bottom: 0, right: -width / 2, opacity: 0.5 },
  blobLight: { position: 'absolute', width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35, backgroundColor: '#701a75', top: height * 0.05, right: width * 0.1, opacity: 0.4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { color: '#a1a1aa', fontSize: 14 },
  nameText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  monthSelector: { marginBottom: 25 },
  monthItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  monthActive: { backgroundColor: '#fff' },
  monthText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
  monthTextActive: { color: '#09090b' },
  statCard: { backgroundColor: '#18181b', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  statLabel: { color: '#a1a1aa', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 10 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionSquare: { flex: 1, aspectRatio: 1, borderRadius: 24, padding: 15, marginHorizontal: 5, justifyContent: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  actionIconContainer: { position: 'absolute', top: 15, right: 15, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  actionSmallText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500' },
  actionBigText: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#71717a', fontSize: 14, textAlign: 'center' },
  txCard: { marginBottom: 10, borderRadius: 16, overflow: 'hidden' },
  txBlur: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  txIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txContent: { flex: 1, justifyContent: 'center' },
  txTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txStore: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 15, marginRight: 12 },
  txAmount: { color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'right' },
  txBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  txDate: { color: '#71717a', fontSize: 12 },
  txCategoryTag: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencyPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#09090b', height: height * 0.9, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, borderTopWidth: 1, borderColor: '#27272a' },
  sheetHeader: { alignItems: 'center', marginBottom: 20 },
  sheetDrag: { width: 40, height: 4, backgroundColor: '#27272a', borderRadius: 2, marginBottom: 15 },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  sheetTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  periodBar: { marginBottom: 20, maxHeight: 40 },
  periodBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#18181b', marginRight: 8, borderWidth: 1, borderColor: '#27272a' },
  periodBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  periodBtnText: { color: '#a1a1aa', fontSize: 12, fontWeight: '600' },
  periodBtnTextActive: { color: '#fff' },
  customRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, backgroundColor: '#18181b', padding: 10, borderRadius: 12 },
  customInput: { flex: 1, height: 40, color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  reportStats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  reportStatItem: { flex: 1, backgroundColor: '#18181b', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#27272a' },
  reportStatVal: { color: '#fff', fontSize: 20, fontWeight: '800' },
  reportStatLab: { color: '#71717a', fontSize: 11, marginTop: 4 },
  excelTable: { flex: 1, backgroundColor: '#09090b', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#18181b', padding: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  tableHeadText: { color: '#71717a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(39, 39, 42, 0.5)' },
  tableCell: { color: '#a1a1aa', fontSize: 13 },
  noRepo: { color: '#71717a', textAlign: 'center', marginTop: 40, fontSize: 14 },
  sheetFilterRow: { marginBottom: 15, gap: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#27272a' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  reportCatBar: { marginTop: 8 },
  miniCatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#27272a' },
  miniCatActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  miniCatText: { color: '#71717a', fontSize: 11, fontWeight: '600' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailCard: { backgroundColor: '#18181b', width: '100%', height: '100%', paddingTop: 60, paddingHorizontal: 24 },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingHorizontal: 10 },
  detailTitle: { color: '#71717a', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  detailAct: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  bigAmt: { color: '#fff', fontSize: 48, fontWeight: '800' },
  bigStore: { color: '#a1a1aa', fontSize: 18, marginBottom: 30 },
  receiptPrev: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#09090b', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  receiptImg: { width: '100%', height: '100%' },
  editForm: { gap: 10, paddingBottom: 20 },
  editLabel: { color: '#71717a', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  rowInputs: { flexDirection: 'row', marginBottom: 5 },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  itemEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catBadgeText: { fontSize: 12, fontWeight: '600' },
  detailDateText: { color: '#71717a', fontSize: 12 },
  itemsList: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { color: '#a1a1aa', fontSize: 13 },
  itemPrice: { color: '#fff', fontSize: 13, fontWeight: '600' },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.1)' },
  viewDetailsText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: '#09090b', borderRadius: 12, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#27272a' },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { backgroundColor: '#3b82f6' },
  canBtn: { backgroundColor: '#27272a' },
  btnText: { color: '#fff', fontWeight: '700' },
  settingsMenu: { backgroundColor: '#18181b', width: 200, borderRadius: 16, padding: 10, position: 'absolute', top: 100, right: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  menuText: { color: '#fff', marginLeft: 10 },
  loaderOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderContent: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 40, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  loaderText: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 20 },
  loaderSubText: { color: '#a1a1aa', fontSize: 13, marginTop: 8 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarEditContainer: { position: 'relative' },
  largeAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#3b82f6' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#18181b' },
  supportForm: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  supportFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  supportFormTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  supportInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  supportSubmitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  supportSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  faqAnswer: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  profileTabs: {
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  profileTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  profileTabIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 12,
  },
  profileTabText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  paywallContent: {
    flex: 1,
  },
  paywallHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  crownContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139,92,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  paywallTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  paywallSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  restoreBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  restoreBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  closePaywallBtn: {
    marginTop: 20,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePaywallText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtnProfessional: {
    backgroundColor: '#3b82f6',
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  saveBtnProfessionalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  policyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'justify',
  },
  subPlanCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  subPlanName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subPlanStatus: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '800',
  },
  bestValueBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  chartTitleContainer: {
    marginBottom: 10,
  },
  visualCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  visualCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  chartSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartWrapper: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    padding: 15,
    paddingBottom: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    gap: 16,
    marginBottom: 30,
  },
  chartBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartBarLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    width: 70,
    fontWeight: '600',
  },
  chartBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  chartBarValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  statsValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
    gap: 4,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  currencySheet: {
    height: height * 0.75,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  currencyTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  currencySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  currencySearchInput: {
    flex: 1,
    fontSize: 15,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  currencySymbolBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
