import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Lock, Users, Search, Plus, Trash2, Crown } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { CreateRoomModal } from '@/components/Chat/CreateRoomModal';
import { JoinRoomModal } from '@/components/Chat/JoinRoomModal';
import { ChatRoom } from '@/components/Chat/ChatRoom';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';

export default function ChatScreen() {
  const { user } = useAuth();
  const { rooms, loading, error, deleteRoom } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<{id: string, name: string} | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }

    // Kullanıcı verisi güncellendiğinde dinle
    const userDataUpdatedListener = () => {
      if (user) {
        fetchUserData();
      }
    };
    
    eventEmitter.on(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    
    // Cleanup
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
  
  const publicRooms = rooms.filter(room => !room.is_private);
  const privateRooms = rooms.filter(room => room.is_private);
  
  const filteredPublicRooms = publicRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrivateRooms = privateRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = (roomId: string, isPrivate: boolean, name: string) => {
    // Eğitim Koçum odası kontrolü
    if (name === "Eğitim Koçum") {
      if (!userData?.is_pro) {
        router.push('/pro-upgrade');
        return;
      }
      // Pro kullanıcılar için direkt erişim
      setSelectedRoomId(roomId);
      return;
    }

    if (isPrivate) {
      setSelectedRoomForJoin({ id: roomId, name });
      setShowJoinModal(true);
    } else {
      setSelectedRoomId(roomId);
    }
  };
  
  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
    } catch (error: any) {
      console.error('Oda silinirken hata oluştu:', error.message);
    }
  };

  const RoomSection = ({ title, rooms, isPrivate }: { title: string, rooms: any[], isPrivate: boolean }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {isPrivate && <Lock size={16} color={Colors.primary[400]} />}
      </View>
      {rooms.map((room) => {
        const isProRoom = room.name === "Eğitim Koçum";
        
        return (
          <Pressable 
            key={room.id} 
            onPress={() => handleJoinRoom(room.id, room.is_private, room.name)}
            style={({ pressed }) => [
              styles.roomCard,
              pressed && styles.roomCardPressed
            ]}
          >
            <View style={styles.roomInfo}>
              <View style={styles.roomNameContainer}>
                <Text style={styles.roomName}>{room.name}</Text>
                {room.is_private && !isProRoom && <Lock size={16} color={Colors.primary[400]} style={styles.lockIcon} />}
                {isProRoom && <Crown size={16} color={Colors.medal.gold} style={styles.lockIcon} />}
              </View>
              <Text style={styles.roomDescription}>{room.description}</Text>
              <View style={styles.roomFooter}>
                <View style={styles.roomStats}>
                  <Users size={14} color={Colors.text.secondary} />
                  <Text style={styles.statsText}>Aktif Oda</Text>
                </View>
                {user?.id === room.created_by && (
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
      {rooms.length === 0 && (
        <Text style={styles.emptyText}>Bu kategoride henüz oda yok</Text>
      )}
    </View>
  );

  if (selectedRoomId) {
    return (
      <ChatRoom
        roomId={selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Sohbet Odaları</Text>
          <TouchableOpacity style={styles.createRoomButton} onPress={handleCreateRoom}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Sohbet odalarında ara..."
            placeholderTextColor={Colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <>
                <RoomSection 
                  title="Şifreli Odalar" 
                  rooms={filteredPrivateRooms}
                  isPrivate={true}
                />
                <RoomSection 
                  title="Public Odalar" 
                  rooms={filteredPublicRooms}
                  isPrivate={false}
                />
              </>
            }
            ListEmptyComponent={
              !filteredPublicRooms.length && !filteredPrivateRooms.length ? (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>Henüz hiç sohbet odası yok</Text>
                  <Button
                    title="Oda Oluştur"
                    onPress={handleCreateRoom}
                    variant="primary"
                    size="medium"
                    style={styles.createButton}
                  />
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>

      <CreateRoomModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />

      {selectedRoomForJoin && (
        <JoinRoomModal
          visible={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedRoomForJoin(null);
          }}
          onSuccess={() => {
            setShowJoinModal(false);
            setSelectedRoomId(selectedRoomForJoin.id);
            setSelectedRoomForJoin(null);
          }}
          roomId={selectedRoomForJoin.id}
          roomName={selectedRoomForJoin.name}
        />
      )}
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
  createRoomButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: Colors.text.primary,
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginRight: Spacing.xs,
  },
  roomCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  roomCardPressed: {
    backgroundColor: Colors.darkGray[800],
    transform: [{ scale: 0.98 }],
  },
  roomInfo: {
    flex: 1,
  },
  roomNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  lockIcon: {
    marginLeft: Spacing.xs,
  },
  roomDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.error,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  createButton: {
    minWidth: 200,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
});