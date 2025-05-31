import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '@/constants/Theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const onPressIn = () => {
    scale.value = withTiming(0.95, { duration: 100, easing: Easing.ease });
  };
  
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 100, easing: Easing.ease });
  };

  const getButtonStyles = (): ViewStyle => {
    let btnStyle: ViewStyle = {};
    
    // Base styles for all buttons
    btnStyle = {
      ...styles.button,
      opacity: disabled ? 0.5 : 1,
    };
    
    // Variant specific styles
    switch (variant) {
      case 'primary':
        btnStyle.backgroundColor = Colors.primary[500];
        break;
      case 'secondary':
        btnStyle.backgroundColor = Colors.darkGray[700];
        break;
      case 'outline':
        btnStyle.backgroundColor = 'transparent';
        btnStyle.borderWidth = 1;
        btnStyle.borderColor = Colors.primary[500];
        break;
      case 'ghost':
        btnStyle.backgroundColor = 'transparent';
        break;
    }
    
    // Size specific styles
    switch (size) {
      case 'small':
        btnStyle.paddingVertical = Spacing.xs;
        btnStyle.paddingHorizontal = Spacing.md;
        btnStyle.borderRadius = BorderRadius.sm;
        break;
      case 'medium':
        btnStyle.paddingVertical = Spacing.sm;
        btnStyle.paddingHorizontal = Spacing.lg;
        btnStyle.borderRadius = BorderRadius.md;
        break;
      case 'large':
        btnStyle.paddingVertical = Spacing.md;
        btnStyle.paddingHorizontal = Spacing.xl;
        btnStyle.borderRadius = BorderRadius.lg;
        break;
    }
    
    return btnStyle;
  };

  const getTextStyles = (): TextStyle => {
    let txtStyle: TextStyle = { ...styles.text };
    
    // Variant specific text styles
    switch (variant) {
      case 'primary':
      case 'secondary':
        txtStyle.color = Colors.text.primary;
        break;
      case 'outline':
      case 'ghost':
        txtStyle.color = Colors.primary[500];
        break;
    }
    
    // Size specific text styles
    switch (size) {
      case 'small':
        txtStyle.fontSize = FontSizes.sm;
        break;
      case 'medium':
        txtStyle.fontSize = FontSizes.md;
        break;
      case 'large':
        txtStyle.fontSize = FontSizes.lg;
        break;
    }
    
    return txtStyle;
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={variant === 'primary' ? 'white' : Colors.primary[500]} />;
    }
    
    if (icon && iconPosition === 'left') {
      return (
        <>
          {icon}
          <Text style={[getTextStyles(), { marginLeft: Spacing.sm }, textStyle]}>{title}</Text>
        </>
      );
    }
    
    if (icon && iconPosition === 'right') {
      return (
        <>
          <Text style={[getTextStyles(), { marginRight: Spacing.sm }, textStyle]}>{title}</Text>
          {icon}
        </>
      );
    }
    
    return <Text style={[getTextStyles(), textStyle]}>{title}</Text>;
  };

  return (
    <AnimatedTouchable
      style={[getButtonStyles(), animatedStyle, style]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});