import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User, Camera } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';

export default function AccountSettingsScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!router.canGoBack()) {
      router.replace('/(tabs)/profile');
      return;
    }

    fetchUserProfile();

    // Realtime subscription for profile updates
    const subscription = supabase
      .channel('profile_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUserProfile();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (userData) {
        setName(userData.name || '');
      }

      // Fetch profile photo
      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (photoError) throw photoError;
      if (photoData) {
        setAvatarUrl(photoData.photo_url);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError('Profil bilgileri yüklenirken bir hata oluştu');
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      setError('Resim seçilirken bir hata oluştu');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile_photos')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(filePath);

      // Update profile_photos table using upsert
      const { error: updateError } = await supabase
        .from('profile_photos')
        .upsert(
          { 
            user_id: user.id, 
            photo_url: publicUrl 
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setSuccess('Profil fotoğrafı başarıyla güncellendi');
      
      // Notify other components
      eventEmitter.emit(Events.USER_DATA_UPDATED);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError('Profil fotoğrafı güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profil başarıyla güncellendi');
      eventEmitter.emit(Events.USER_DATA_UPDATED);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (newPassword !== confirmPassword) {
        throw new Error('Yeni şifreler eşleşmiyor');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Şifre başarıyla güncellendi');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Hesap Ayarları</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: avatarUrl || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
              }} 
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.changeAvatarButton}
              onPress={handleImagePick}
              disabled={loading}
            >
              <Camera size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="İsminizi girin"
              leftIcon={<User size={20} color={Colors.darkGray[400]} />}
            />
            <Input
              value={user?.email}
              editable={false}
              placeholder="E-posta adresiniz"
              leftIcon={<Mail size={20} color={Colors.darkGray[400]} />}
            />
            <Button
              title="Profili Güncelle"
              onPress={handleUpdateProfile}
              variant="primary"
              size="large"
              isLoading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Yeni şifrenizi girin"
              secureTextEntry
              leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            />
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Yeni şifrenizi tekrar girin"
              secureTextEntry
              leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            />
            <Button
              title="Şifreyi Güncelle"
              onPress={handleUpdatePassword}
              variant="primary"
              size="large"
              isLoading={loading}
              style={styles.button}
            />
          </View>

          {error && (
            <View style={styles.messageContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.messageContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary[500],
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: Colors.primary[500],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.dark,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.md,
  },
  messageContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.success,
    textAlign: 'center',
  },
});