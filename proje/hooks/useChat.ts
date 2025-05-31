import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/supabase';

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

export function useChat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    
    const subscription = supabase
      .channel('public:chat_rooms')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_rooms' 
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
        .from('chat_rooms')
        .select('*')
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
        .from('chat_rooms')
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

      // Şifreli oda oluşturulduğunda otomatik olarak katıl
      if (data) {
        await joinRoom(data.id, password);
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user.id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
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
        .from('chat_room_members')
        .upsert({
          room_id: roomId,
          user_id: user.id
        });

      if (memberError) throw memberError;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const sendMessage = async (roomId: string, content: string) => {
    try {
      if (!user) throw new Error('Oturum açmanız gerekiyor');

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content
        });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
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
    deleteRoom,
    sendMessage,
    fetchMessages
  };
}