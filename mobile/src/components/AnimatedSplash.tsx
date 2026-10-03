import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

/**
 * A "Framer Motion" style custom splash screen.
 * It provides a smooth entry (scale + fade) and an elegant exit
 * to transition into the main application content.
 */
export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Logo Entry: Scale and Fade in
    logoScale.value = withTiming(1, { 
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    logoOpacity.value = withTiming(1, { duration: 500 });

    // 2. Logo Exit: Zoom in slightly and fade out entire screen
    const triggerExit = () => {
       containerOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
         if (finished) {
           runOnJS(onFinish)();
         }
       });
       logoScale.value = withTiming(1.3, { 
         duration: 400, 
         easing: Easing.in(Easing.exp) 
       });
    };

    // Visible for 700ms then start smooth exit transition
    const exitTimer = setTimeout(triggerExit, 700);
    
    return () => clearTimeout(exitTimer);
  }, [logoScale, logoOpacity, containerOpacity, onFinish]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Animated.Image
        source={require('../../assets/expenseFavicon.png')}
        style={[styles.logo, animatedLogoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff', // Clean blank screen
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it stays on top
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
  },
});
