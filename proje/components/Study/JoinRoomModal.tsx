import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { X, Lock } from 'lucide-react-native';
import { useStudyRooms } from '@/hooks/useStudyRooms';

interface JoinRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
  roomId: string;
  roomName: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  visible,
  onClose,
  onSuccess,
  roomId,
  roomName
}) => {
  const { joinRoom } = useStudyRooms();
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

      const room = await joinRoom(roomId, password);
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