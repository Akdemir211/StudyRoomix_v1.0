import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { TimerDisplay } from '@/components/UI/AnimatedCounter';
import { useAuth } from '@/context/AuthContext';
import { Clock, Users, ArrowLeft, RotateCcw } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { supabase } from '@/lib/supabase';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface StudyRoomProps {
  roomId: string;
  room: {
    id: string;
    name: string;
    description: string;
    is_private: boolean;
    created_by: string;
  };
  onClose: () => void;
}

interface MemberTimer {
  startTime: string;
  elapsedTime: number;
}

export default function StudyRoom({ roomId, room, onClose }: StudyRoomProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [memberTimers, setMemberTimers] = useState<Record<string, MemberTimer>>({});
  const [memberPhotos, setMemberPhotos] = useState<Record<string, string>>({});
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

  const fetchMembers = async () => {
    try {
      const { data: roomMembers, error } = await supabase
        .from('study_room_members')
        .select(`
          user_id,
          current_session_id,
          user:users(
            id,
            name,
            avatar_url
          ),
          session:study_sessions(
            id,
            created_at,
            duration,
            ended_at
          )
        `)
        .eq('room_id', roomId);

      if (!error && roomMembers) {
        setMembers(roomMembers);
        
        const newTimers: Record<string, MemberTimer> = {};
        roomMembers.forEach(member => {
          if (member.current_session_id && member.session) {
            const startTime = new Date(member.session.created_at);
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            
            if (member.user_id === user?.id) {
              newTimers[member.user_id] = {
                startTime: member.session.created_at,
                elapsedTime: elapsedTime
              };
            } else {
              newTimers[member.user_id] = {
                startTime: member.session.created_at,
                elapsedTime: elapsed
              };
            }
          }
        });
        setMemberTimers(newTimers);

        // Fetch profile photos
        const userIds = roomMembers.map(member => member.user_id);
        const { data: photoData } = await supabase
          .from('profile_photos')
          .select('user_id, photo_url')
          .in('user_id', userIds);

        if (photoData) {
          const photoMap = photoData.reduce((acc: Record<string, string>, photo) => {
            acc[photo.user_id] = photo.photo_url;
            return acc;
          }, {});
          setMemberPhotos(photoMap);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
    
    const membersSubscription = supabase
      .channel('study_room_members')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_room_members',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchMembers();
      })
      .subscribe();

    const sessionsSubscription = supabase
      .channel('study_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_sessions'
      }, () => {
        fetchMembers();
      })
      .subscribe();

    const photosSubscription = supabase
      .channel('profile_photos')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos'
      }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      membersSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
      photosSubscription.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemberTimers(prevTimers => {
        const updatedTimers: Record<string, MemberTimer> = {};
        
        members.forEach(member => {
          if (member.current_session_id) {
            const prevTimer = prevTimers[member.user_id];
            if (prevTimer) {
              if (member.user_id === user?.id) {
                updatedTimers[member.user_id] = {
                  ...prevTimer,
                  elapsedTime: elapsedTime
                };
              } else {
                updatedTimers[member.user_id] = {
                  ...prevTimer,
                  elapsedTime: prevTimer.elapsedTime + 1
                };
              }
            }
          }
        });
        
        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [members, elapsedTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}s ${minutes}d ${secs}sn`;
    } else if (minutes > 0) {
      return `${minutes}d ${secs}sn`;
    }
    return `${secs}sn`;
  };

  const handleTimerAction = async () => {
    if (isRunning) {
      await stopTimer();
      await updateSession(roomId, null);
    } else if (isPaused) {
      await resumeTimer();
      const session = await startTimer();
      if (session?.id) {
        await updateSession(roomId, session.id);
      }
    } else {
      const session = await startTimer();
      if (session?.id) {
        await updateSession(roomId, session.id);
      }
    }
  };

  const handleReset = async () => {
    await resetTimer();
    await updateSession(roomId, null);
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <FloatingBubbleBackground />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.roomStats}>
            <Users size={14} color={Colors.text.secondary} />
            <Text style={styles.statsText}>{members.length} üye</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.timerSection}>
          <Text style={styles.sectionTitle}>Çalışma Sayacı</Text>
          
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
                  <Clock size={24} color={Colors.text.primary} />
                  <Text style={styles.timerButtonText}>Duraklat</Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.timerButtonContent}>
                  <Clock size={24} color={Colors.text.primary} />
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
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Aktif Üyeler</Text>
          
          {members.map((member) => (
            <View key={member.user_id} style={styles.memberCard}>
              <Image 
                source={{ 
                  uri: memberPhotos[member.user_id] || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
                }} 
                style={styles.memberAvatar} 
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.user?.name || 'Anonim Kullanıcı'}
                  {member.user_id === user?.id ? ' (Sen)' : ''}
                </Text>
                
                {member.current_session_id ? (
                  <View style={styles.memberTimer}>
                    <Clock size={14} color={Colors.primary[400]} />
                    <Text style={styles.memberTimerText}>
                      {member.user_id === user?.id ? 
                        formatTime(elapsedTime) : 
                        formatTime(memberTimers[member.user_id]?.elapsedTime || 0)
                      }
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.memberStatus}>Bekliyor</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  timerSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
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
  membersSection: {
    flex: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  memberTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  memberTimerText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  memberStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export { StudyRoom }