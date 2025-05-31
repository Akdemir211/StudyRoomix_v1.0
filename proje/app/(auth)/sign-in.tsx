import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useAuth } from '@/context/AuthContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, isLoading } = useAuth();
  
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (!password) {
      newErrors.password = 'Şifre gerekli';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    try {
      await signIn(email, password);
    } catch (error: any) {
      if (error.message?.includes('invalid_credentials')) {
        setErrors({
          email: 'E-posta adresi veya şifre hatalı',
          password: 'E-posta adresi veya şifre hatalı'
        });
      } else {
        setErrors({
          password: 'Giriş yapılamadı. Lütfen tekrar deneyin.'
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
          <Text style={styles.title}>Tekrar Hoşgeldin</Text>
          <Text style={styles.subtitle}>Ding'e devam etmek için giriş yap</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Input
            label={null}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="E-posta adresinizi girin"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={Colors.darkGray[400]} />}
            error={errors.email}
          />
          
          <Input
            label={null}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="Şifrenizi girin"
            secureTextEntry
            leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            error={errors.password}
          />
          
          <Button
            title="Giriş Yap"
            onPress={handleSignIn}
            variant="primary"
            size="large"
            isLoading={isLoading}
            style={styles.button}
          />
          
          <View style={styles.bottomText}>
            <Text style={styles.noAccountText}>Hesabın yok mu?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Kayıt Ol</Text>
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
  noAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginRight: Spacing.xs,
  },
  signUpLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.primary[500],
  },
});