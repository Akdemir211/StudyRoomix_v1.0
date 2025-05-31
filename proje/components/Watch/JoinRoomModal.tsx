import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { X, Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface JoinWatchRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
  roomId: string;
  roomName: string;
}

export const JoinWatchRoomModal: React.FC<JoinWatchRoomModalProps> = ({
  visible,
  onClose,
  onSuccess,
  roomId,
  roomName
}) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!password.trim()) {
        throw new Error('Şifre gerekli');
      }

      if (!user) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      // Odayı ve şifresini kontrol et
      const { data: room, error: roomError } = await supabase
        .from('watch_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      if (room.password_hash !== password) {
        throw new Error('Yanlış şifre');
      }

      // Odaya katıl - upsert kullanarak
      const { error: memberError } = await supabase
        .from('watch_room_members')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        });

      if (memberError) throw memberError;

      onSuccess(room);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Şifreli Odaya Katıl</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.roomName}>{roomName}</Text>

          <Input
            label=""
            value={password}
            onChangeText={setPassword}
            placeholder="Şifreyi girin"
            secureTextEntry
            leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            title="Odaya Katıl"
            onPress={handleJoin}
            variant="primary"
            size="large"
            isLoading={loading}
            style={styles.joinButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.primary[400],
    marginBottom: Spacing.md,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  joinButton: {
    marginTop: Spacing.md,
  },
});