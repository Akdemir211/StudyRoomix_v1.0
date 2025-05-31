import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Brain, LineChart as ChartLine, Bot, Infinity, Gift } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { Card } from '@/components/UI/Card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

// Yeni olay yayınlama için EventEmitter
import { eventEmitter, Events } from '@/lib/eventEmitter';

const ProFeature = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      {icon}
    </View>
    <Text style={styles.featureText}>{title}</Text>
  </View>
);

export default function ProUpgradeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshUserDataAndNavigate = async () => {
    try {
      // Pro üyelik durumu güncellendikten sonra olay yayınla
      eventEmitter.emit(Events.USER_DATA_UPDATED);
      
      // Kısa bir gecikme sonrası ana sayfaya dön
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 300);
    } catch (error: any) {
      console.error('User data refresh error:', error.message);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Kullanıcının pro üyeliğini güncelle
      const { error } = await supabase
        .from('users')
        .update({ is_pro: true })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserDataAndNavigate();
    } catch (error: any) {
      console.error('Pro üyelik yükseltme hatası:', error.message);
      setError('Pro üyelik yükseltme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoCode = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Promosyon kodunu kontrol et
      if (promoCode.toUpperCase() === 'İBRAHİM100') {
        // Pro üyeliği aktifleştir
        const { error } = await supabase
          .from('users')
          .update({ is_pro: true })
          .eq('id', user.id);

        if (error) throw error;

        await refreshUserDataAndNavigate();
      } else {
        setError('Geçersiz promosyon kodu');
      }
    } catch (error: any) {
      console.error('Promosyon kodu hatası:', error.message);
      setError('Promosyon kodu kullanılamadı. Lütfen tekrar deneyin.');
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
          <Text style={styles.title}>Pro Sürümle Tanışın</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Card style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Crown size={32} color={Colors.primary[400]} />
              <Text style={styles.priceTitle}>Pro Üyelik</Text>
            </View>
            <View style={styles.priceContent}>
              <Text style={styles.price}>59.90 ₺</Text>
              <Text style={styles.priceSubtext}>aylık</Text>
            </View>
          </Card>

          <View style={styles.featuresContainer}>
            <ProFeature
              icon={<ChartLine size={24} color={Colors.primary[400]} />}
              title="Başarı analizi"
            />
            <ProFeature
              icon={<Brain size={24} color={Colors.primary[400]} />}
              title="Yapay zeka destekli eğitim koçluğu"
            />
            <ProFeature
              icon={<Bot size={24} color={Colors.primary[400]} />}
              title="Yapay zeka destekli soru çözüm asistanı"
            />
            <ProFeature
              icon={<Infinity size={24} color={Colors.primary[400]} />}
              title="Sınırsız kullanım hakkı"
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {showPromoCode ? (
            <View style={styles.promoContainer}>
              <Input
                label="Promosyon Kodu"
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="Promosyon kodunuzu girin"
                leftIcon={<Gift size={20} color={Colors.darkGray[400]} />}
              />
              <Button
                title="Kodu Kullan"
                onPress={handlePromoCode}
                variant="primary"
                size="large"
                isLoading={loading}
                style={styles.promoButton}
              />
            </View>
          ) : (
            <>
              <Button
                title="Pro'ya Yükselt"
                onPress={handleUpgrade}
                variant="primary"
                size="large"
                isLoading={loading}
                style={styles.upgradeButton}
              />
              <Button
                title="Promosyon Kodu Kullan"
                onPress={() => setShowPromoCode(true)}
                variant="outline"
                size="large"
                style={styles.promoCodeButton}
              />
            </>
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
    padding: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  priceCard: {
    marginBottom: Spacing.xl,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  priceTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  priceContent: {
    alignItems: 'center',
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: Colors.primary[400],
  },
  priceSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  featuresContainer: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[800],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  upgradeButton: {
    marginTop: Spacing.xl,
  },
  promoCodeButton: {
    marginTop: Spacing.md,
  },
  promoContainer: {
    marginTop: Spacing.xl,
  },
  promoButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});