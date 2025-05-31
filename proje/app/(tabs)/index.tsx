import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { router } from 'expo-router';
import { ArrowRight, MessageSquare, Clock, Users, Bot, Video } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  SlideInRight,
  FadeOut
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FeatureCard = ({ icon, title, description, onPress }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  onPress: () => void
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    
    opacity.value = withSequence(
      withDelay(200, withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })),
      withTiming(1, { duration: 0 })
    );
    
    setTimeout(() => {
      onPress();
    }, 300);
  };

  return (
    <Animated.View 
      style={animatedStyle}
      entering={FadeIn.delay(300).duration(500)}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Card style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            {icon}
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
          </View>
          <Animated.View 
            style={styles.featureArrow}
            entering={SlideInRight.delay(500).duration(500)}
          >
            <ArrowRight size={20} color={Colors.primary[400]} />
          </Animated.View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = React.useState<any>(null);
  const welcomeOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  
  useEffect(() => {
    welcomeOpacity.value = withTiming(1, { duration: 800 });
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    cardTranslateY.value = withDelay(300, withTiming(0, { duration: 800 }));

    if (user) {
      fetchUserData();
    }

    const userDataUpdatedListener = () => {
      if (user) {
        fetchUserData();
      }
    };
    
    eventEmitter.on(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    
    return () => {
      eventEmitter.off(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    };
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (!user || !user.id) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  
  const activityScale = useSharedValue(1);
  
  useEffect(() => {
    activityScale.value = withSequence(
      withTiming(1.1, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    );
    
    const interval = setInterval(() => {
      activityScale.value = withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const activityStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activityScale.value }],
  }));

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.welcomeContainer, welcomeStyle]}>
            <Text style={styles.welcomeText}>Tekrar hoşgeldin,</Text>
            <Text style={styles.nameText}>{userData?.name || 'Misafir'}</Text>
            
            <View style={styles.activeNowContainer}>
              <Animated.View style={[styles.activeNowDot, activityStyle]} />
              <Text style={styles.activeNowText}>12 arkadaşın aktif</Text>
            </View>
          </Animated.View>
          
          <Animated.View style={[styles.featuresContainer, cardStyle]}>
            <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
            
            <FeatureCard 
              icon={<MessageSquare size={24} color={Colors.primary[500]} />}
              title="Sohbet Odaları"
              description="Genel sohbetlere katıl veya özel şifreli odalar oluştur"
              onPress={() => router.push('/(tabs)/chat')}
            />
            
            <FeatureCard 
              icon={<Clock size={24} color={Colors.primary[500]} />}
              title="Çalışma Oturumları"
              description="Çalışma süresini takip et ve arkadaşlarınla yarış"
              onPress={() => router.push('/(tabs)/study')}
            />

            <FeatureCard 
              icon={<Video size={24} color={Colors.primary[500]} />}
              title="Watch Room"
              description="Arkadaşlarınla beraber video izle ve sohbet et"
              onPress={() => router.push('/watch')}
            />
            
            <TouchableOpacity 
              onPress={() => {
                if (userData?.is_pro) {
                  router.push('/ai-chat');
                } else {
                  router.push('/pro-upgrade');
                }
              }}
            >
              <Card style={styles.aiCard}>
                <Image 
                  source={{ uri: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
                  style={styles.aiCardImage}
                  resizeMode="cover"
                />
                <View style={styles.aiCardOverlay}>
                  <Bot size={32} color={Colors.primary[400]} style={styles.aiCardIcon} />
                  <Text style={styles.aiCardTitle}>
                    {userData?.is_pro ? 'Eğitim Koçum' : 'Yapay Zeka ile Çalış'}
                  </Text>
                  <Text style={styles.aiCardDescription}>
                    {userData?.is_pro 
                      ? 'Yapay zeka destekli eğitim asistanınız size yardımcı olmak için hazır'
                      : 'Yapay zeka destekli eğitim koçu ve soru çözüm asistanı ile çalışmalarını daha verimli hale getir'
                    }
                  </Text>
                  {!userData?.is_pro && (
                    <Button 
                      title="Pro'ya Yükselt" 
                      onPress={() => router.push('/pro-upgrade')}
                      variant="primary"
                      size="small"
                      style={styles.aiCardButton}
                    />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
            
            <View style={styles.imageCard}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/5935755/pexels-photo-5935755.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageTitle}>Çalışma Arkadaşları Bul</Text>
                <Text style={styles.imageDescription}>Çalışma arkadaşları bul ve birlikte motive ol</Text>
                <Button 
                  title="Çalışma Odalarını Keşfet" 
                  onPress={() => router.push('/(tabs)/study')}
                  variant="primary"
                  size="small"
                  style={styles.imageButton}
                />
              </View>
            </View>
          </Animated.View>
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
  scrollContent: {
    padding: Spacing.lg,
  },
  welcomeContainer: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xl,
    color: Colors.text.secondary,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  activeNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeNowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  activeNowText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  featuresContainer: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  featureArrow: {
    padding: Spacing.xs,
  },
  aiCard: {
    height: 220,
    marginVertical: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  aiCardImage: {
    width: '100%',
    height: '100%',
  },
  aiCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.lg,
  },
  aiCardIcon: {
    marginBottom: Spacing.sm,
  },
  aiCardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  aiCardDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  aiCardButton: {
    alignSelf: 'flex-start',
  },
  imageCard: {
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Spacing.md,
    justifyContent: 'flex-end',
  },
  imageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  imageDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  imageButton: {
    alignSelf: 'flex-start',
  },
});