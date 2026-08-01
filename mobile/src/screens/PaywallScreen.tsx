import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getOfferings, purchasePackage, restorePurchases, PACKAGE_IDS, PACKAGE_ID_FALLBACKS } from '../services/subscriptionService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

interface PaywallScreenProps {
  onClose: () => void;
  isForced?: boolean;
}

export default function PaywallScreen({ onClose, isForced = false }: PaywallScreenProps) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { refreshPremium, trialDaysLeft } = useAuth();
  const [offerings, setOfferings] = useState<any>(null);
  const [offeringsError, setOfferingsError] = useState(false);
  const [offeringsErrorDetail, setOfferingsErrorDetail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const result = await getOfferings();
      if (result.status === 'ok') {
        setOfferings(result.offering);
        setOfferingsError(false);
        setOfferingsErrorDetail('');
      } else {
        setOfferings(null);
        setOfferingsError(true);
        setOfferingsErrorDetail(result.message);
      }
    } catch (e) {
      console.error('Paywall: Failed to load offerings', e);
      setOfferingsError(true);
      setOfferingsErrorDetail('Could not reach RevenueCat. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        await refreshPremium();
        Alert.alert(t('common.success'), 'Welcome to Premium!');
        onClose();
      }
    } catch (e: any) {
      if (e.userCancelled) return;
      Alert.alert(t('common.error'), e.message || 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        await refreshPremium();
        Alert.alert(t('common.success'), 'Purchases restored!');
        onClose();
      } else {
        Alert.alert('Restore', 'No active subscription found.');
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || 'Restore failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const features = [
    { icon: 'camera', text: 'AI Receipt Scanning', sub: 'Instant extraction from any photo' },
    { icon: 'bar-chart', text: 'Advanced Analytics', sub: 'Detailed trends and insights' },
    { icon: 'cloud-upload', text: 'Unlimited Cloud Storage', sub: 'Your receipts, safe forever' },
    { icon: 'document-text', text: 'Excel Exports', sub: 'Download filtered expense reports' },
    { icon: 'notifications', text: 'Smart Notifications', sub: 'Get notified when scans complete' },
  ];

  const getPackagePrice = (type: string) => {
    if (!offerings) return '...';
    const pkg = offerings.availablePackages.find((p: any) => p.packageType === type || p.identifier === PACKAGE_IDS[type as keyof typeof PACKAGE_IDS]);
    return pkg?.product.priceString || '...';
  };

  const findPackage = (type: keyof typeof PACKAGE_IDS) => {
    if (!offerings) return null;
    // Prefer RevenueCat standard package slots ($rc_monthly / $rc_annual / $rc_lifetime)
    if (type === 'MONTHLY' && offerings.monthly) return offerings.monthly;
    if (type === 'YEARLY' && offerings.annual) return offerings.annual;
    if (type === 'LIFETIME' && offerings.lifetime) return offerings.lifetime;

    const ids = PACKAGE_ID_FALLBACKS[type];
    const rcIds =
      type === 'MONTHLY' ? ['$rc_monthly', 'MONTHLY'] :
      type === 'YEARLY' ? ['$rc_annual', 'ANNUAL', 'YEARLY'] :
      ['$rc_lifetime', 'LIFETIME'];

    return (
      offerings.availablePackages?.find((p: any) =>
        ids.includes(p.product?.identifier) ||
        ids.includes(p.identifier) ||
        rcIds.includes(p.identifier) ||
        rcIds.includes(p.packageType)
      ) ?? null
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1e1b4b', '#0f172a'] : ['#f5f3ff', '#fff']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Blobs */}
      <View style={[styles.blob, { top: -100, right: -50, backgroundColor: '#8b5cf633' }]} />
      <View style={[styles.blob, { bottom: -100, left: -50, backgroundColor: '#3b82f633' }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, isForced && { display: 'none' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroContent}>
            <LinearGradient
              colors={['#8b5cf6', '#3b82f6']}
              style={styles.iconContainer}
            >
              <Ionicons name="sparkles" size={40} color="#fff" />
            </LinearGradient>
            <Text style={[styles.title, { color: theme.text }]}>{t('premium.upgrade')}</Text>
            <Text style={[styles.subtitle, { color: theme.textDim }]}>
              Master your finances with the ultimate expense tracking tools.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <Ionicons name={f.icon as any} size={20} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>{f.text}</Text>
                  <Text style={[styles.featureSub, { color: theme.textDim }]}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator color="#8b5cf6" size="large" style={{ marginTop: 40 }} />
          ) : offeringsError ? (
            <View style={{ alignItems: 'center', marginTop: 30, padding: 20 }}>
              <Ionicons name="construct-outline" size={48} color={theme.textDim} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 16 }}>
                Subscription plans not set up yet
              </Text>
              <Text style={{ color: theme.textDim, fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 21 }}>
                {offeringsErrorDetail || 'RevenueCat returned an empty offering.'}
              </Text>
              <Text style={{ color: theme.textDim, fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 20 }}>
                Dashboard fix: Offerings → Expense Sage Offering → add 3 packages (monthly, yearly, lifetime) and attach products to entitlement “Expense Tracker Premium”.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: '#8b5cf6', borderRadius: 20 }}
                onPress={() => { setOfferingsError(false); setIsLoading(true); loadOfferings(); }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              {/* Monthly Plan */}
              {findPackage('MONTHLY') && (
                <TouchableOpacity
                  style={[styles.planCard, { borderColor: theme.border }]}
                  onPress={() => handlePurchase(findPackage('MONTHLY')!)}
                  disabled={isPurchasing}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                    {trialDaysLeft > 0 && (
                      <Text style={[styles.planTrial, { color: '#8b5cf6' }]}>{trialDaysLeft} days trial left</Text>
                    )}
                  </View>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {findPackage('MONTHLY')!.product.priceString}/mo
                  </Text>
                </TouchableOpacity>
              )}

              {/* Yearly Plan - Featured */}
              {findPackage('YEARLY') && (
                <TouchableOpacity 
                  style={[styles.planCardFeatured, { borderColor: '#8b5cf6' }]} 
                  onPress={() => handlePurchase(findPackage('YEARLY')!)}
                  disabled={isPurchasing}
                >
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planNameFeatured}>Annual</Text>
                    <Text style={styles.planTrialFeatured}>Billed yearly</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planPriceFeatured}>
                      {findPackage('YEARLY')!.product.priceString}
                    </Text>
                    <Text style={styles.planMonthlyPrice}>
                      Only {(findPackage('YEARLY')!.product.price / 12).toFixed(2)}/mo
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Lifetime Plan */}
              {findPackage('LIFETIME') && (
                <TouchableOpacity 
                  style={[styles.planCard, { borderColor: theme.border }]} 
                  onPress={() => handlePurchase(findPackage('LIFETIME')!)}
                  disabled={isPurchasing}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: theme.text }]}>Lifetime</Text>
                    <Text style={[styles.planTrial, { color: theme.textDim }]}>One-time payment</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {findPackage('LIFETIME')!.product.priceString}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
              <Text style={[styles.footerLink, { color: theme.textDim }]}>{t('premium.restore')}</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <Text style={[styles.footerText, { color: theme.textDim }]}>
              Secure payment via App Store. Cancel anytime.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {isPurchasing && (
        <BlurView intensity={20} tint="dark" style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Processing...</Text>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    padding: 12,
    borderRadius: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 13,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  planCardFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#8b5cf611',
    position: 'relative',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  planNameFeatured: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  planTrial: {
    fontSize: 13,
    fontWeight: '600',
  },
  planTrialFeatured: {
    fontSize: 14,
    color: '#8b5cf6',
    opacity: 0.8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  planPriceFeatured: {
    fontSize: 22,
    fontWeight: '900',
    color: '#8b5cf6',
  },
  planMonthlyPrice: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerDivider: {
    height: 1,
    width: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 15,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
  }
});
