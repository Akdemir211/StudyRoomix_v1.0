import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  withDelay
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingBubbleProps {
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  startX?: number;
  startY?: number;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  size = 30 + Math.random() * 50,
  color = Colors.primary[300],
  delay = Math.random() * 10000,
  duration = 15000 + Math.random() * 20000,
  startX = Math.random() * SCREEN_WIDTH,
  startY = SCREEN_HEIGHT + 100
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const scale = useSharedValue(0.8 + Math.random() * 0.4);
  
  useEffect(() => {
    // Fade in
    opacity.value = withDelay(
      delay, 
      withTiming(0.3 + Math.random() * 0.2, { duration: 2000 })
    );
    
    // Move upward with some horizontal drift
    translateY.value = withDelay(
      delay,
      withTiming(-100, { 
        duration: duration,
        easing: Easing.linear
      })
    );
    
    // Slightly move left/right
    const direction = Math.random() > 0.5 ? 1 : -1;
    const distance = 20 + Math.random() * 60;
    
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(startX + (direction * distance), {
          duration: 5000 + Math.random() * 5000,
          easing: Easing.sin
        }),
        -1,
        true
      )
    );
    
    // Slight size oscillation
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.9 + Math.random() * 0.3, {
          duration: 4000 + Math.random() * 3000,
          easing: Easing.sin
        }),
        -1,
        true
      )
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value }
      ],
    };
  });
  
  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  );
};

const BUBBLE_COUNT = 12;

export const FloatingBubbleBackground: React.FC = () => {
  return (
    <View style={styles.container}>
      {[...Array(BUBBLE_COUNT)].map((_, index) => {
        const hue = index * (360 / BUBBLE_COUNT);
        const color = `hsla(${hue}, 70%, 65%, 0.1)`;
        return <FloatingBubble key={index} color={color} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  bubble: {
    position: 'absolute',
    bottom: 0,
  }
});