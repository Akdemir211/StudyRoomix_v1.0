import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { 
  Settings, 
  Clock, 
  User, 
  Award, 
  MessageSquare, 
  LogOut, 
  ChevronRight,
  Crown,
  HelpCircle,
  Bell,
  Trophy,
  Medal,
  Target,
  BookOpen,
  Brain,
  Clock12,
  Lock
} from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withDelay,
  FadeIn
} from 'react-native-reanimated';

// Başarım tipleri
const ACHIEVEMENTS = {
  STUDY_MASTER: {
    id: 'study_master',
    title: 'Çalışma Ustası',
    description: '10 saat kesintisiz çalışma',
    icon: Clock12,
    color: Colors.medal.gold
  },
  BRAIN_POWER: {
    id: 'brain_power',
    title: 'Beyin Gücü',
    description: '100 soru çözümü',
    icon: Brain,
    color: Colors.medal.silver
  },
  BOOKWORM: {
    id: 'bookworm',
    title: 'Kitap Kurdu',
    description: '50 saat toplam çalışma',
    icon: BookOpen,
    color: Colors.medal.bronze
  },
  FOCUSED: {
    id: 'focused',
    title: 'Odaklanmış',
    description: '5 gün üst üste çalışma',
    icon: Target,
    color: Colors.primary[400]
  }
};

const ProfileStatCard = ({ 
  icon, 
  title, 
  value 
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string 
}) => {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  );
};

const SettingsItem = ({ 
  icon, 
  title, 
  onPress,
  showProBadge,
  showNotificationBadge
}: { 
  icon: React.ReactNode, 
  title: string, 
  onPress: () => void,
  showProBadge?: boolean,
  showNotificationBadge?: boolean
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const notificationScale = useSharedValue(0);
  
  const notificationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationScale.value }]
  }));

  const handlePress = () => {
    if (showProBadge) {
      setShowNotification(true);
      notificationScale.value = withSequence(
        withSpring(1),
        withDelay(2000, withSpring(0))
      );
      setTimeout(() => setShowNotification(false), 2500);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.settingsItem} onPress={handlePress}>
      <View style={styles.settingsItemIcon}>{icon}</View>
      <Text style={styles.settingsItemTitle}>{title}</Text>
      {showNotificationBadge && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>2</Text>
        </View>
      )}
      <ChevronRight size={20} color={Colors.text.secondary} />
      
      {showNotification && (
        <Animated.View style={[styles.notification, notificationStyle]}>
          <Text style={styles.notificationText}>Zaten Pro Kullanıcısınız</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const AchievementCard = ({
  achievement,
  unlocked
}: {
  achievement: typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS],
  unlocked: boolean
}) => {
  const Icon = achievement.icon;
  
  return (
    <Animated.View 
      style={styles.achievementCard}
      entering={FadeIn.delay(200)}
    >
      <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
        <Icon size={24} color={Colors.text.primary} />
      </View>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
      </View>
      {unlocked ? (
        <Medal size={20} color={achievement.color} />
      ) : (
        <Lock size={20} color={Colors.text.secondary} />
      )}
    </Animated.View>
  );
};

const getRankInfo = (messageCount: number) => {
  if (messageCount >= 200) {
    return { title: 'Profesör', color: Colors.medal.gold };
  } else if (messageCount >= 100) {
    return { title: 'Doçent', color: Colors.medal.silver };
  } else if (messageCount >= 20) {
    return { title: 'Öğrenci', color: Colors.medal.bronze };
  } else {
    return { title: 'Çaylak', color: Colors.text.secondary };
  }
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  useEffect(() => {
    fetchUserStats();
    checkAchievements();

    const userSubscription = supabase
      .channel('user_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user?.id}`
      }, () => {
        fetchUserStats();
      })
      .subscribe();

    const studySubscription = supabase
      .channel('study_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_leaderboard',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUserStats();
        checkAchievements();
      })
      .subscribe();

    const messageSubscription = supabase
      .channel('message_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUserStats();
      })
      .subscribe();

    const photoSubscription = supabase
      .channel('photo_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchProfilePhoto();
      })
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      studySubscription.unsubscribe();
      messageSubscription.unsubscribe();
      photoSubscription.unsubscribe();
    };
  }, [user?.id]);

  const fetchProfilePhoto = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfilePhotoUrl(data?.photo_url || null);
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserData(userProfile);

      // Fetch profile photo
      await fetchProfilePhoto();

      const { data: studyData } = await supabase
        .from('study_leaderboard')
        .select('total_duration')
        .eq('user_id', user.id)
        .maybeSingle();

      setTotalStudyTime(studyData ? studyData.total_duration || 0 : 0);

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setMessageCount(count || 0);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const unlocked = [];

      // Çalışma Ustası kontrolü
      const { data: longestSession } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', user.id)
        .order('duration', { ascending: false })
        .limit(1)
        .single();

      if (longestSession && longestSession.duration >= 600) { // 10 saat
        unlocked.push(ACHIEVEMENTS.STUDY_MASTER.id);
      }

      // Kitap Kurdu kontrolü
      if (totalStudyTime >= 3000) { // 50 saat
        unlocked.push(ACHIEVEMENTS.BOOKWORM.id);
      }

      // Beyin Gücü kontrolü
      const { count: solvedQuestions } = await supabase
        .from('ai_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (solvedQuestions && solvedQuestions >= 100) {
        unlocked.push(ACHIEVEMENTS.BRAIN_POWER.id);
      }

      // Odaklanmış kontrolü
      const { data: consecutiveDays } = await supabase
        .from('study_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (consecutiveDays) {
        let streak = 1;
        let lastDate = new Date(consecutiveDays[0]?.created_at);

        for (let i = 1; i < consecutiveDays.length; i++) {
          const currentDate = new Date(consecutiveDays[i].created_at);
          const diffDays = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            streak++;
            if (streak >= 5) {
              unlocked.push(ACHIEVEMENTS.FOCUSED.id);
              break;
            }
          } else if (diffDays > 1) {
            streak = 1;
          }
          
          lastDate = currentDate;
        }
      }

      setUnlockedAchievements(unlocked);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}`;
  };

  const handleAccountSettings = () => {
    router.push('/account-settings');
  };

  const handleNotificationSettings = () => {
    router.push('/notification-settings');
  };

  const handleUpgradePro = () => {
    router.push('/pro-upgrade');
  };

  const handleHelpSupport = () => {
    router.push('/help-support');
  };

  const rankInfo = getRankInfo(messageCount);

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Profilim</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleAccountSettings}>
            <Settings size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileSection}>
            <Image 
              source={{ 
                uri: profilePhotoUrl || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
              }} 
              style={styles.profileImage}
            />
            <View style={styles.nameContainer}>
              {userData?.is_pro && <Crown size={24} color={Colors.medal.gold} />}
              <Text style={styles.userName}>{userData?.name || 'Misafir'}</Text>
              {userData?.is_pro && <Crown size={24} color={Colors.medal.gold} />}
            </View>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.userStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statsSection}>
            <ProfileStatCard 
              icon={<Clock size={24} color={Colors.primary[500]} />} 
              title="Çalışma Saati" 
              value={formatStudyTime(totalStudyTime)}
            />
            <ProfileStatCard 
              icon={<MessageSquare size={24} color={Colors.primary[500]} />} 
              title="Mesajlar" 
              value={messageCount.toString()}
            />
            <ProfileStatCard 
              icon={<Award size={24} color={rankInfo.color} />} 
              title="Rütbe" 
              value={rankInfo.title}
            />
          </View>

          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>
              <Trophy size={20} color={Colors.primary[400]} style={styles.sectionIcon} />
              Başarımlar
            </Text>
            <Card style={styles.achievementsCard}>
              {Object.values(ACHIEVEMENTS).map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlockedAchievements.includes(achievement.id)}
                />
              ))}
            </Card>
          </View>
          
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Ayarlar</Text>
            <Card style={styles.settingsCard}>
              <SettingsItem 
                icon={<User size={20} color={Colors.primary[400]} />}
                title="Hesap Ayarları"
                onPress={handleAccountSettings}
              />
              <SettingsItem 
                icon={<Bell size={20} color={Colors.primary[400]} />}
                title="Bildirimler"
                onPress={handleNotificationSettings}
                showNotificationBadge={true}
              />
              <SettingsItem 
                icon={<Crown size={20} color={Colors.primary[400]} />}
                title={userData?.is_pro ? "Pro Kullanıcı" : "Pro'ya Yükselt"}
                onPress={handleUpgradePro}
                showProBadge={userData?.is_pro}
              />
              <SettingsItem 
                icon={<HelpCircle size={20} color={Colors.primary[400]} />}
                title="Yardım & Destek"
                onPress={handleHelpSupport}
              />
            </Card>
          </View>
          
          <Button
            title="Çıkış Yap"
            onPress={signOut}
            variant="outline"
            size="medium"
            icon={<LogOut size={20} color={Colors.primary[500]} />}
            iconPosition="left"
            style={styles.signOutButton}
          />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
    color: Colors.text.primary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.primary[500],
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[800],
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: 4,
  },
  statIcon: {
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  statTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  achievementsSection: {
    marginBottom: Spacing.xl,
  },
  achievementsCard: {
    padding: Spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: Spacing.xs,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
    position: 'relative',
  },
  settingsItemIcon: {
    marginRight: Spacing.md,
    width: 24,
  },
  settingsItemTitle: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  notificationBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  notificationBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xs,
    color: Colors.text.primary,
  },
  signOutButton: {
    marginTop: Spacing.md,
  },
  notification: {
    position: 'absolute',
    top: -40,
    right: Spacing.lg,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
  },
});