import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/ThemeProvider';

const { width, height } = Dimensions.get('window');
const SIDE = 44;
const TOP = Platform.OS === 'ios' ? 62 : 36;
const BOTTOM = Platform.OS === 'ios' ? 36 : 28;

type Props = {
  onExplore: () => void;
  onSignIn: () => void;
};

export default function LandingScreen({ onExplore, onSignIn }: Props) {
  const { t } = useTranslation();
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.blob, styles.blob1, { backgroundColor: theme.blob1 }]} />
        <View style={[styles.blob, styles.blob2, { backgroundColor: theme.blob2 }]} />
        <View style={[styles.blob, styles.blob3, { backgroundColor: theme.blob3 }]} />
      </View>

      <View style={styles.frame}>
        <View style={styles.header}>
          <View
            style={[
              styles.brandBadge,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#fff',
                borderColor: theme.border,
              },
            ]}
          >
            <Image source={require('../../assets/expenseFavicon.png')} style={styles.logo} />
            <Text style={[styles.brandName, { color: theme.text }]} numberOfLines={1}>
              Expense Manager
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#fff',
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSignIn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.loginLink, { color: theme.accent }]}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{t('explore.landing_title')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textDim }]}>
            {t('explore.landing_subtitle')}
          </Text>

          <TouchableOpacity
            onPress={onExplore}
            activeOpacity={0.9}
            style={[styles.exploreBtn, { backgroundColor: isDark ? '#fff' : '#0f172a' }]}
          >
            <Text style={[styles.exploreBtnText, { color: isDark ? theme.accent : '#fff' }]}>
              {t('explore.explore_cta')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onSignIn} style={styles.accountHit}>
            <Text
              style={[
                styles.accountLink,
                { color: isDark ? 'rgba(255,255,255,0.75)' : theme.textDim },
              ]}
            >
              {t('explore.already_have_account')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frame: {
    flex: 1,
    paddingTop: TOP,
    paddingBottom: BOTTOM,
    paddingLeft: SIDE,
    paddingRight: SIDE,
  },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.65 },
  blob1: {
    width: width * 0.9,
    height: width * 0.9,
    top: -height * 0.1,
    left: -width * 0.2,
  },
  blob2: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: height * 0.12,
    right: -width * 0.3,
  },
  blob3: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.32,
    left: width * 0.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logo: { width: 22, height: 22, borderRadius: 6 },
  brandName: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 0 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLink: { fontSize: 15, fontWeight: '700' },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  exploreBtn: {
    alignSelf: 'flex-start',
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    minHeight: 52,
    justifyContent: 'center',
  },
  exploreBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  accountHit: { paddingVertical: 10, paddingHorizontal: 16 },
  accountLink: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
