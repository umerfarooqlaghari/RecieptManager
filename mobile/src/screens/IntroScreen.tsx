import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/ThemeProvider';

const { width: SCREEN_W, height } = Dimensions.get('window');
const SIDE = 44;
const TOP = Platform.OS === 'ios' ? 62 : 36;
const BOTTOM = Platform.OS === 'ios' ? 36 : 28;

const SLIDE_ICONS = [
  'camera-outline',
  'pie-chart-outline',
  'shield-checkmark-outline',
  'rocket-outline',
] as const;

type Props = {
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onSignIn: () => void;
};

export default function IntroScreen({ onBack, onSkip, onFinish, onSignIn }: Props) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [0, 1, 2, 3].map(i => ({
    icon: SLIDE_ICONS[i],
    title: t(`explore.slide${i + 1}_title`),
    body: t(`explore.slide${i + 1}_body`),
  }));

  const isLast = slideIndex === slides.length - 1;

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setSlideIndex(index);
  };

  const handleNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    goToSlide(slideIndex + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.blob, styles.blob1, { backgroundColor: theme.blob1 }]} />
        <View style={[styles.blob, styles.blob2, { backgroundColor: theme.blob2 }]} />
        <View style={[styles.blob, styles.blob3, { backgroundColor: theme.blob3 }]} />
      </View>

      <View style={styles.frame}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.circleBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          {!isLast ? (
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: theme.textDim }]}>{t('explore.skip')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
          style={styles.pager}
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            if (index >= 0 && index < slides.length) setSlideIndex(index);
          }}
        >
          {slides.map((slide, i) => (
            <View key={i} style={styles.slide}>
              <View style={styles.slideInner}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.12)',
                    },
                  ]}
                >
                  <Ionicons name={slide.icon} size={34} color={theme.accent} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
                <Text style={[styles.body, { color: theme.textDim }]}>{slide.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: theme.border },
                  idx === slideIndex && { width: 24, backgroundColor: theme.accent },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, { backgroundColor: isDark ? '#fff' : '#0f172a' }]}
            activeOpacity={0.9}
          >
            <Text style={[styles.nextBtnText, { color: isDark ? theme.accent : '#fff' }]}>
              {isLast ? t('explore.get_started') : t('explore.next')}
            </Text>
          </TouchableOpacity>

          {isLast ? (
            <TouchableOpacity onPress={onSignIn} style={styles.accountLink}>
              <Text style={[styles.accountLinkText, { color: theme.textDim }]}>
                {t('explore.already_have_account')}
              </Text>
            </TouchableOpacity>
          ) : null}
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
  },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.65 },
  blob1: {
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    top: -height * 0.1,
    left: -SCREEN_W * 0.2,
  },
  blob2: {
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    bottom: height * 0.12,
    right: -SCREEN_W * 0.3,
  },
  blob3: {
    width: SCREEN_W * 0.6,
    height: SCREEN_W * 0.6,
    top: height * 0.32,
    left: SCREEN_W * 0.2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIDE,
    marginBottom: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { fontWeight: '700', fontSize: 14 },
  pager: { flex: 1 },
  slide: {
    width: SCREEN_W,
    justifyContent: 'center',
  },
  slideInner: {
    paddingHorizontal: SIDE,
    paddingVertical: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
  },
  footer: {
    paddingHorizontal: SIDE,
    paddingTop: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    fontWeight: '800',
    fontSize: 16,
  },
  accountLink: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  accountLinkText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
