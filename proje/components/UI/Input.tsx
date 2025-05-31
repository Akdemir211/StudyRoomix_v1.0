import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/Theme';
import { Eye, EyeOff } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const borderColor = useSharedValue(Colors.darkGray[600]);
  const labelScale = useSharedValue(value ? 0.85 : 1);
  const labelTranslateY = useSharedValue(value ? -20 : 0);
  
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));
  
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: labelScale.value },
      { translateY: labelTranslateY.value },
    ],
  }));
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderColor.value = withTiming(Colors.primary[500], { duration: 200 });
    if (!value) {
      labelScale.value = withTiming(0.85, { duration: 200 });
      labelTranslateY.value = withTiming(-20, { duration: 200 });
    }
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderColor.value = withTiming(Colors.darkGray[600], { duration: 200 });
    if (!value) {
      labelScale.value = withTiming(1, { duration: 200 });
      labelTranslateY.value = withTiming(0, { duration: 200 });
    }
    if (onBlur) onBlur(e);
  };
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.Text 
          style={[
            styles.label, 
            labelAnimatedStyle,
            labelStyle, 
            error ? styles.errorLabel : null
          ]}
        >
          {label}
        </Animated.Text>
      )}
      
      <Animated.View 
        style={[
          styles.inputContainer, 
          borderStyle,
          isFocused ? styles.focusedInput : null,
          error ? styles.errorInput : null
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 8 } : null,
            secureTextEntry ? { paddingRight: 40 } : null,
            inputStyle
          ]}
          placeholderTextColor={Colors.darkGray[500]}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={Colors.darkGray[400]} />
            ) : (
              <Eye size={20} color={Colors.darkGray[400]} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkGray[600],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[800],
  },
  focusedInput: {
    borderColor: Colors.primary[500],
  },
  errorInput: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.text.primary,
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    paddingHorizontal: Spacing.md,
  },
  leftIcon: {
    marginLeft: Spacing.md,
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  errorLabel: {
    color: Colors.error,
  },
});