import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useAuth } from '@/context/AuthContext';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [cooldown, setCooldown] = useState(0);
  const { signUp, isLoading } = useAuth();
  
  // Handle cooldown timer
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);
  
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    
    if (!name) {
      newErrors.name = 'İsim gerekli';
    }
    
    if (!email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignUp = async () => {
    if (!validateForm() || cooldown > 0) return;
    
    try {
      await signUp(email, password, name);
      // Show success message after successful signup
      setErrors({
        email: 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.'
      });
    } catch (error: any) {
      if (error.message?.includes('over_email_send_rate_limit')) {
        const waitTime = parseInt(error.message.match(/\d+/)[0] || '60');
        setCooldown(waitTime);
        setErrors({
          email: `Güvenlik nedeniyle ${waitTime} saniye beklemeniz gerekiyor.`
        });
      } else {
        setErrors({
          email: error.message || 'Kayıt başarısız. Lütfen tekrar deneyin.'
        });
      }
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <FloatingBubbleBackground />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>Ding'e katılmak için kayıt ol</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Input
            label={null}
            value={name}
            onChangeText={setName}
            placeholder="İsminizi girin"
            autoCapitalize="words"
            leftIcon={<User size={20} color={Colors.darkGray[400]} />}
            error={errors.name}
          />
          
          <Input
            label={null}
            value={email}
            onChangeText={setEmail}
            placeholder="E-posta adresinizi girin"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={Colors.darkGray[400]} />}
            error={errors.email}
          />
          
          <Input
            label={null}
            value={password}
            onChangeText={setPassword}
            placeholder="Şifre oluşturun"
            secureTextEntry
            leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            error={errors.password}
          />
          
          <Input
            label={null}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Şifrenizi tekrar girin"
            secureTextEntry
            leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            error={errors.confirmPassword}
          />
          
          <Button
            title={cooldown > 0 ? `Lütfen ${cooldown} saniye bekleyin` : "Hesap Oluştur"}
            onPress={handleSignUp}
            variant="primary"
            size="large"
            isLoading={isLoading}
            style={styles.button}
            disabled={cooldown > 0}
          />
          
          <View style={styles.bottomText}>
            <Text style={styles.accountText}>Zaten hesabın var mı? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  formContainer: {
    marginTop: Spacing.md,
  },
  button: {
    marginTop: Spacing.lg,
  },
  bottomText: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  accountText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  signInLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.primary[500],
  },
});