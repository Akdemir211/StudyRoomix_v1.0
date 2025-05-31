import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows } from '@/constants/Theme';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'small' | 'medium' | 'large';
  animated?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'medium',
  animated = false,
  onPress,
}) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withTiming(0.98, { duration: 150 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withTiming(1, { duration: 150 });
    }
  };

  const getShadowStyle = () => {
    switch (elevation) {
      case 'small':
        return Shadows.small;
      case 'medium':
        return Shadows.medium;
      case 'large':
        return Shadows.large;
      default:
        return Shadows.medium;
    }
  };

  const CardComponent = animated ? Animated.View : View;
  const cardProps = animated
    ? {
        style: [styles.card, getShadowStyle(), animatedStyle, style],
        onTouchStart: handlePressIn,
        onTouchEnd: handlePressOut,
      }
    : {
        style: [styles.card, getShadowStyle(), style],
      };

  return <CardComponent {...cardProps}>{children}</CardComponent>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: 16,
    overflow: 'hidden',
  },
});