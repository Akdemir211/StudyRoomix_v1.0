import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { MessageSquare, Clock, Users, Brain } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const featureOpacity = useSharedValue(0);
  const featureTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }
    
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.ease });
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(200, withTiming(0, { duration: 800 }));
    featureOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    featureTranslateY.value = withDelay(500, withTiming(0, { duration: 800 }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    buttonTranslateY.value = withDelay(800, withTiming(0, { duration: 800 }));
  }, []);
  
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));
  
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  
  const featureStyle = useAnimatedStyle(() => ({
    opacity: featureOpacity.value,
    transform: [{ translateY: featureTranslateY.value }],
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FloatingBubbleBackground />
      
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/7311920/pexels-photo-7311920.jpeg?auto=compress&cs=tinysrgb&w=600' }}
          style={[styles.logo, { width: width * 0.5, height: width * 0.5 }]}
        />
      </Animated.View>
      
      <Animated.View style={[styles.contentContainer, titleStyle]}>
        <Text style={styles.appName}>Ding</Text>
        <Text style={styles.tagline}>Bağlan. Sohbet Et. Birlikte Çalış.</Text>
      </Animated.View>
      
      <Animated.View style={[styles.featuresContainer, featureStyle]}>
        <View style={styles.featureItem}>
          <MessageSquare size={24} color={Colors.primary[400]} />
          <Text style={styles.featureText}>Özel konuşmalar için şifreli sohbet odaları</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Clock size={24} color={Colors.primary[400]} />
          <Text style={styles.featureText}>Verimlilik zamanlayıcılı çalışma odaları</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Users size={24} color={Colors.primary[400]} />
          <Text style={styles.featureText}>Sıralama tablolu ortak çalışma alanları</Text>
        </View>

        <View style={styles.featureItem}>
          <Brain size={24} color={Colors.primary[400]} />
          <Text style={styles.featureText}>Yapay zeka destekli eğitim koçu</Text>
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <Button 
          title="Giriş Yap" 
          onPress={() => router.push('/(auth)/sign-in')} 
          variant="primary"
          size="large"
          style={styles.button}
        />
        <Button 
          title="Hesap Oluştur" 
          onPress={() => router.push('/(auth)/sign-up')} 
          variant="outline"
          size="large"
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  logo: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  contentContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[900],
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});