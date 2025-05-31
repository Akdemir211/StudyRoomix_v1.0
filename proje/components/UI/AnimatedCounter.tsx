import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { FontSizes, Colors } from '@/constants/Theme';

// Make sure the value is a proper number string (e.g., "01", "59")
const formatNumberString = (value: number): string => {
  const num = Math.floor(value);
  return num < 10 ? `0${num}` : `${num}`;
};

const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedNumberProps {
  value: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

const AnimatedNumber = ({ value, fontSize = FontSizes.xxxl, fontFamily = 'Inter-Bold', color = Colors.text.primary }: AnimatedNumberProps) => {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const num = Math.floor(animatedValue.value);
    return {
      children: num < 10 ? `0${num}` : `${num}`,
    };
  });

  return (
    <AnimatedText
      style={[styles.number, { fontSize, fontFamily, color }]}
      animatedProps={animatedProps}
    >
      {formatNumberString(value)}
    </AnimatedText>
  );
};

interface TimerDisplayProps {
  hours: number;
  minutes: number;
  seconds: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  hours,
  minutes,
  seconds,
  size = 'medium',
  color = Colors.text.primary,
}) => {
  const getFontSize = () => {
    switch (size) {
      case 'small': return FontSizes.lg;
      case 'medium': return FontSizes.xxl;
      case 'large': return FontSizes.xxxl;
      default: return FontSizes.xxl;
    }
  };

  return (
    <View style={styles.timerContainer}>
      <AnimatedNumber value={hours} fontSize={getFontSize()} color={color} />
      <Text style={[styles.separator, { fontSize: getFontSize(), color }]}>:</Text>
      <AnimatedNumber value={minutes} fontSize={getFontSize()} color={color} />
      <Text style={[styles.separator, { fontSize: getFontSize(), color }]}>:</Text>
      <AnimatedNumber value={seconds} fontSize={getFontSize()} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: 'Inter-Bold',
    includeFontPadding: false,
    textAlign: 'center',
  },
  separator: {
    fontFamily: 'Inter-Bold',
    includeFontPadding: false,
    marginHorizontal: 2,
  },
});