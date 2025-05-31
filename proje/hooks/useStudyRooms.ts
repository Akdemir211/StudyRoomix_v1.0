import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/supabase';

type StudyRoom = Database['public']['Tables']['study_rooms']['Row'];
type StudyRoomMember = Database['public']['Tables']['study_room_members']['Row'];

export function useStudyRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    
    // Realtime subscription for room changes
    const roomsSubscription = supabase
      .channel('study_rooms_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'study_rooms' 
      }, () => {
        fetchRooms();
      })
      .subscribe();

    // Realtime subscription for member changes
    const membersSubscription = supabase
      .channel('study_room_members_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_room_members'
      }, () => {
        fetchRooms();
      })
      .subscribe();

    // Realtime subscription for session changes
    const sessionsSubscription = supabase
      .channel('study_sessions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_sessions'
      }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      roomsSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select(`
          *,
          members:study_room_members(count),
          current_members:study_room_members(
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
          )
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

  const createRoom = async (name: string, description: string, isPrivate: boolean, password?: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { data, error } = await supabase
        .from('study_rooms')
        .insert({
          name,
          description,
          is_private: isPrivate,
          password_hash: password,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Odayı oluşturan kişi otomatik olarak katılsın
      if (data) {
        await joinRoom(data.id, password);
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Şifre kontrolü
      if (room.is_private) {
        if (!password) {
          throw new Error('Bu oda için şifre gerekli');
        }
        if (password !== room.password_hash) {
          throw new Error('Yanlış şifre');
        }
      }

      const { error: memberError } = await supabase
        .from('study_room_members')
        .upsert({
          room_id: roomId,
          user_id: user.id
        });

      if (memberError) throw memberError;

      // Başarılı katılım sonrası odayı döndür
      return room;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const leaveRoom = async (roomId: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { error } = await supabase
        .from('study_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { error } = await supabase
        .from('study_rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user.id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateSession = async (roomId: string, sessionId: string | null) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { error } = await supabase
        .from('study_room_members')
        .update({ current_session_id: sessionId })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    rooms,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    updateSession
  };
}