import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { TimerDisplay } from '@/components/UI/AnimatedCounter';
import { useAuth } from '@/context/AuthContext';
import { Clock, BookOpen, Users, Plus, Play, Pause, RotateCcw, Lock, Trash2 } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { useStudyRooms } from '@/hooks/useStudyRooms';
import { CreateRoomModal } from '@/components/Study/CreateRoomModal';
import { JoinRoomModal } from '@/components/Study/JoinRoomModal';
import { StudyRoom } from '@/components/Study/StudyRoom';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';

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
              
              <View style={styles.statItem}>
                <Clock size={14} color={Colors.text.secondary} />
                <Text style={styles.statText}>
                  {room.current_members?.filter((m: any) => m.current_session_id).length || 0} aktif
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

export default function StudyScreen() {
  const { user, session, loading } = useAuth();
  const { 
    isRunning, 
    isPaused,
    elapsedTime, 
    startTimer, 
    stopTimer,
    resumeTimer,
    resetTimer,
    saveSession,
    updateSession 
  } = useStudyTimer();
  
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    deleteRoom
  } = useStudyRooms();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (!loading && (!user || !session)) {
      router.replace('/(auth)/sign-in');
      return;
    }
  }, [user, session, loading]);

  useEffect(() => {
    return () => {
      if (isRunning || isPaused) {
        saveSession();
      }
    };
  }, [isRunning, isPaused]);

  const handleTimerAction = () => {
    if (!user) return;
    
    if (isRunning) {
      stopTimer();
    } else if (isPaused) {
      resumeTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = async () => {
    if (!user) return;
    await resetTimer();
  };

  const handleCreateRoom = () => {
    if (!user) return;
    setShowCreateModal(true);
  };

  const handleJoinRoom = (roomId: string, isPrivate: boolean, name: string) => {
    if (!user) return;
    
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
    if (!user) return;
    
    try {
      await deleteRoom(roomId);
    } catch (error: any) {
      console.error('Oda silinirken hata oluştu:', error.message);
    }
  };

  if (loading || !user || !session) {
    return null;
  }

  if (selectedRoomId && selectedRoom) {
    return (
      <StudyRoom
        roomId={selectedRoomId}
        room={selectedRoom}
        onClose={() => {
          setSelectedRoomId(null);
          setSelectedRoom(null);
        }}
      />
    );
  }

  // Odaları şifreli ve public olarak ayır
  const privateRooms = rooms.filter(room => room.is_private);
  const publicRooms = rooms.filter(room => !room.is_private);

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Çalışma Oturumu</Text>
          <TouchableOpacity style={styles.createRoomButton} onPress={handleCreateRoom}>
            <Plus size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <BookOpen size={24} color={Colors.primary[500]} />
            <Text style={styles.timerTitle}>Çalışma Sayacı</Text>
          </View>

          <View style={styles.timerDisplay}>
            <TimerDisplay
              hours={Math.floor(elapsedTime / 3600)}
              minutes={Math.floor((elapsedTime % 3600) / 60)}
              seconds={elapsedTime % 60}
              size="large"
            />
          </View>

          <View style={styles.timerControls}>
            <TouchableOpacity
              style={[styles.timerButton, isRunning && styles.timerButtonActive]}
              onPress={handleTimerAction}
            >
              {isRunning ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.timerButtonContent}>
                  <Pause size={24} color={Colors.text.primary} />
                  <Text style={styles.timerButtonText}>Duraklat</Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.timerButtonContent}>
                  <Play size={24} color={Colors.text.primary} />
                  <Text style={styles.timerButtonText}>{isPaused ? 'Devam Et' : 'Başla'}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resetButton, !elapsedTime && styles.resetButtonDisabled]}
              onPress={handleReset}
              disabled={!elapsedTime}
            >
              <RotateCcw size={24} color={Colors.text.primary} />
              <Text style={styles.resetButtonText}>Sıfırla</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.roomsContainer}>
          <Text style={styles.sectionTitle}>Çalışma Odaları</Text>

          {roomsLoading ? (
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          ) : roomsError ? (
            <Text style={styles.errorText}>{roomsError}</Text>
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
                  <Text style={styles.emptyText}>Henüz hiç çalışma odası yok</Text>
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
        </View>
      </SafeAreaView>

      <CreateRoomModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newRoom) => {
          setShowCreateModal(false);
          setSelectedRoomId(newRoom.id);
          setSelectedRoom(newRoom);
        }}
      />

      {selectedRoomForJoin && (
        <JoinRoomModal
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
  timerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  timerControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timerButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonActive: {
    backgroundColor: Colors.darkGray[700],
  },
  timerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.darkGray[700],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  roomsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roomsList: {
    flex: 1,
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
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
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
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
});