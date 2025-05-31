import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { router } from 'expo-router';
import { ArrowLeft, MessageSquare, Bell, Clock, Users } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'messages',
      title: 'Mesaj Bildirimleri',
      description: 'Yeni mesaj geldiğinde bildirim al',
      icon: MessageSquare,
      enabled: true
    },
    {
      id: 'study_reminders',
      title: 'Çalışma Hatırlatıcıları',
      description: 'Günlük çalışma hedeflerini hatırlat',
      icon: Clock,
      enabled: true
    },
    {
      id: 'room_invites',
      title: 'Oda Davetleri',
      description: 'Yeni oda davetlerinde bildirim al',
      icon: Users,
      enabled: true
    },
    {
      id: 'achievements',
      title: 'Başarım Bildirimleri',
      description: 'Yeni başarımlar kazandığında bildirim al',
      icon: Bell,
      enabled: true
    }
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ));
  };

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Bildirim Ayarları</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Hangi bildirimleri almak istediğinizi seçin. Bildirimleri istediğiniz zaman açıp kapatabilirsiniz.
          </Text>

          <Card style={styles.settingsCard}>
            {settings.map((setting) => {
              const Icon = setting.icon;
              return (
                <View key={setting.id} style={styles.settingItem}>
                  <View style={styles.settingIcon}>
                    <Icon size={24} color={Colors.primary[400]} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.enabled}
                    onValueChange={() => toggleSetting(setting.id)}
                    trackColor={{ 
                      false: Colors.darkGray[700], 
                      true: Colors.primary[500] 
                    }}
                    thumbColor={Colors.text.primary}
                  />
                </View>
              );
            })}
          </Card>

          <Text style={styles.note}>
            Not: Bildirim ayarlarınız otomatik olarak kaydedilir.
          </Text>
        </View>
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
  content: {
    padding: Spacing.lg,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  settingsCard: {
    marginBottom: Spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});