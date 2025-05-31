import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { router } from 'expo-router';
import { ArrowLeft, Mail, MessageSquare, Globe, Phone } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';

const ContactItem = ({ 
  icon, 
  title, 
  value,
  onPress
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string,
  onPress: () => void
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.contactItem}>
        <View style={styles.contactIcon}>{icon}</View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>{title}</Text>
          <Text style={styles.contactValue}>{value}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default function HelpSupportScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:akdemiribrahim007@gmail.com');
  };

  const handleChat = () => {
    // Chat desteği henüz aktif değil
    console.log('Chat desteği yakında!');
  };

  const handleWebsite = () => {
    Linking.openURL('https://roomiks.netlify.app/');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+905323859586');
  };

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Yardım & Destek</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            Herhangi bir sorunuz veya sorununuz mu var? Size yardımcı olmaktan mutluluk duyarız.
            Aşağıdaki kanallardan bizimle iletişime geçebilirsiniz.
          </Text>

          <View style={styles.contactList}>
            <ContactItem
              icon={<Mail size={24} color={Colors.primary[400]} />}
              title="E-posta"
              value="akdemiribrahim007@gmail.com"
              onPress={handleEmail}
            />

            <ContactItem
              icon={<MessageSquare size={24} color={Colors.primary[400]} />}
              title="Canlı Destek"
              value="7/24 Chat Desteği"
              onPress={handleChat}
            />

            <ContactItem
              icon={<Globe size={24} color={Colors.primary[400]} />}
              title="Website"
              value="https://roomiks.netlify.app/"
              onPress={handleWebsite}
            />

            <ContactItem
              icon={<Phone size={24} color={Colors.primary[400]} />}
              title="Telefon"
              value="+90 532 385 9586"
              onPress={handlePhone}
            />
          </View>

          <Card style={styles.faqCard}>
            <Text style={styles.faqTitle}>Sıkça Sorulan Sorular</Text>
            <Text style={styles.faqDescription}>
              Sıkça sorulan sorular ve cevapları için websitemizi ziyaret edebilirsiniz.
            </Text>
          </Card>
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
  contactList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  contactValue: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  faqCard: {
    padding: Spacing.lg,
  },
  faqTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  faqDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
});