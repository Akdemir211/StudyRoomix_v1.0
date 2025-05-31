import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { MessageSquare, Clock, Users, ArrowLeft } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

type Message = Database['public']['Tables']['chat_messages']['Row'];
type Room = Database['public']['Tables']['chat_rooms']['Row'];

interface ChatRoomProps {
  roomId: string;
  onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onClose }) => {
  const { user } = useAuth();
  const { sendMessage, fetchMessages } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [users, setUsers] = useState<{[key: string]: {name: string, photoUrl: string | null}}>({}); 
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    loadRoomDetails();
    loadUsers();
    subscribeToMessages();
    subscribeToMembers();
    subscribeToPhotos();
  }, [roomId]);

  const loadUsers = async () => {
    try {
      // Fetch user profiles
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');
      
      if (userError) throw userError;

      // Fetch profile photos
      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url');

      if (photoError) throw photoError;

      // Create user map with photos
      const userMap = (userData || []).reduce((acc: any, user) => {
        const photo = photoData?.find(p => p.user_id === user.id);
        acc[user.id] = { 
          name: user.name || 'Anonim Kullanıcı',
          photoUrl: photo?.photo_url || null
        };
        return acc;
      }, {});

      setUsers(userMap);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const subscribeToPhotos = () => {
    const subscription = supabase
      .channel('profile_photos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos'
      }, () => {
        loadUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadRoomDetails = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      const { count, error: countError } = await supabase
        .from('chat_room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (countError) throw countError;
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error loading room details:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await fetchMessages(roomId);
      setMessages(data);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(() => scrollToBottom(), 100);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToMembers = () => {
    const subscription = supabase
      .channel(`members:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        loadRoomDetails();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setLoading(true);
      await sendMessage(roomId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.dark,
    zIndex: 9999,
  }));

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName}>{room?.name || 'Yükleniyor...'}</Text>
          <View style={styles.roomStats}>
            <Users size={14} color={Colors.text.secondary} />
            <Text style={styles.statsText}>{memberCount} üye</Text>
          </View>
        </View>
      </View>

      <View style={styles.chatBackground}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.map((message, index) => {
            const isOwnMessage = message.user_id === user?.id;
            const showAvatar = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== message.user_id);
            const userInfo = users[message.user_id];
            
            return (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  isOwnMessage ? styles.ownMessageWrapper : null
                ]}
              >
                {!isOwnMessage && showAvatar && (
                  <Image 
                    source={{ 
                      uri: userInfo?.photoUrl || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
                    }}
                    style={styles.avatar}
                  />
                )}
                <View style={[
                  styles.messageContainer,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage,
                  !isOwnMessage && !showAvatar && styles.continuedMessage
                ]}>
                  {!isOwnMessage && showAvatar && (
                    <Text style={styles.messageSender}>{userInfo?.name}</Text>
                  )}
                  <Text style={styles.messageText}>{message.content}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(message.created_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesaj"
            placeholderTextColor={Colors.text.secondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || loading}
          >
            <MessageSquare size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.darker,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statsText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageWrapper: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.xs,
  },
  messageContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    maxWidth: '100%',
  },
  ownMessage: {
    backgroundColor: Colors.primary[500],
    borderTopRightRadius: BorderRadius.xs,
  },
  otherMessage: {
    backgroundColor: Colors.darkGray[700],
    borderTopLeftRadius: BorderRadius.xs,
  },
  continuedMessage: {
    marginLeft: 40, // Avatar width + margin
  },
  messageSender: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.primary[400],
    marginBottom: 2,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputWrapper: {
    backgroundColor: Colors.background.darker,
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray[800],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    paddingRight: 40,
    color: Colors.text.primary,
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});