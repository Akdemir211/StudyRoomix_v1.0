import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Video, Users, ArrowLeft, Plus, Lock, Trash2 } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { CreateWatchRoomModal } from '@/components/Watch/CreateRoomModal';
import { JoinWatchRoomModal } from '@/components/Watch/JoinRoomModal';
import { WatchRoom } from '@/components/Watch/WatchRoom';

const RoomCard = ({ room, onPress, onDelete }: { room: any, onPress: () => void, onDelete?: () => void }) => {
  const { user } = useAuth();
  const isCreator = room.created_by === user?.id;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.roomCardContainer}
    >
      <Card style={styles.roomCard}>
        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{room.name}</Text>
            {room.is_private && (
              <Lock size={16} color={Colors.primary[400]} />
            )}
          </View>
          
          <Text style={styles.roomDescription}>{room.description}</Text>
          
          <View style={styles.roomFooter}>
            <View style={styles.roomStats}>
              <View style={styles.statItem}>
                <Users size={14} color={Colors.text.secondary} />
                <Text style={styles.statText}>
                  {room.members?.length || 0} üye
                </Text>
              </View>
            </View>

            {isCreator && onDelete && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={styles.deleteButton}
              >
                <Trash2 size={16} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const RoomSection = ({ title, rooms, isPrivate, onJoinRoom, onDeleteRoom }: { 
  title: string, 
  rooms: any[], 
  isPrivate: boolean,
  onJoinRoom: (roomId: string, isPrivate: boolean, name: string) => void,
  onDeleteRoom: (roomId: string) => void
}) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isPrivate && <Lock size={16} color={Colors.primary[400]} />}
    </View>
    
    {rooms.map((room) => (
      <RoomCard 
        key={room.id}
        room={room}
        onPress={() => onJoinRoom(room.id, room.is_private, room.name)}
        onDelete={() => onDeleteRoom(room.id)}
      />
    ))}
    
    {rooms.length === 0 && (
      <Text style={styles.emptyText}>Bu kategoride henüz oda yok</Text>
    )}
  </View>
);

export default function WatchScreen() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchRooms();
    
    const subscription = supabase
      .channel('watch_rooms_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'watch_rooms' 
      }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_rooms')
        .select(`
          *,
          members:watch_room_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleJoinRoom = (roomId: string, isPrivate: boolean, name: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (isPrivate) {
      setSelectedRoomForJoin({ id: roomId, name });
      setShowJoinModal(true);
    } else {
      setSelectedRoomId(roomId);
      setSelectedRoom(room);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('watch_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Oda silinirken hata oluştu:', error.message);
    }
  };

  if (selectedRoomId && selectedRoom) {
    return (
      <WatchRoom
        roomId={selectedRoomId}
        room={selectedRoom}
        onClose={() => {
          setSelectedRoomId(null);
          setSelectedRoom(null);
        }}
      />
    );
  }

  const privateRooms = rooms.filter(room => room.is_private);
  const publicRooms = rooms.filter(room => !room.is_private);

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Watch Room</Text>
          <TouchableOpacity style={styles.createRoomButton} onPress={handleCreateRoom}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
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
          <ScrollView style={styles.roomsList}>
            <RoomSection 
              title="Şifreli Odalar"
              rooms={privateRooms}
              isPrivate={true}
              onJoinRoom={handleJoinRoom}
              onDeleteRoom={handleDeleteRoom}
            />
            
            <RoomSection 
              title="Genel Odalar"
              rooms={publicRooms}
              isPrivate={false}
              onJoinRoom={handleJoinRoom}
              onDeleteRoom={handleDeleteRoom}
            />
            
            {privateRooms.length === 0 && publicRooms.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Henüz hiç izleme odası yok</Text>
                <Button
                  title="Oda Oluştur"
                  onPress={handleCreateRoom}
                  variant="primary"
                  size="medium"
                  style={styles.emptyButton}
                />
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      <CreateWatchRoomModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newRoom) => {
          setShowCreateModal(false);
          setSelectedRoomId(newRoom.id);
          setSelectedRoom(newRoom);
        }}
      />

      {selectedRoomForJoin && (
        <JoinWatchRoomModal
          visible={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedRoomForJoin(null);
          }}
          onSuccess={(joinedRoom) => {
            setShowJoinModal(false);
            setSelectedRoomId(selectedRoomForJoin.id);
            setSelectedRoom(joinedRoom);
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
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
  roomsList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
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
  roomCardContainer: {
    marginBottom: Spacing.md,
  },
  roomCard: {
    padding: Spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  roomDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  emptyButton: {
    minWidth: 150,
  },
});