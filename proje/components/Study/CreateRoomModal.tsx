import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { X, Lock, BookOpen } from 'lucide-react-native';
import { useStudyRooms } from '@/hooks/useStudyRooms';

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const { createRoom } = useStudyRooms();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!name.trim()) {
        throw new Error('Oda adı gerekli');
      }

      await createRoom(name, description, isPrivate, isPrivate ? password : undefined);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
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
            <Text style={styles.title}>Yeni Çalışma Odası</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Input
            label="Oda Adı"
            value={name}
            onChangeText={setName}
            placeholder="Oda adını girin"
            leftIcon={<BookOpen size={20} color={Colors.darkGray[400]} />}
          />

          <Input
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            placeholder="Oda açıklamasını girin"
            multiline
          />

          <TouchableOpacity
            style={styles.privateToggle}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={[styles.checkbox, isPrivate && styles.checkboxChecked]}>
              <Lock size={16} color={isPrivate ? Colors.text.primary : Colors.text.secondary} />
            </View>
            <Text style={styles.privateText}>Şifreli Oda</Text>
          </TouchableOpacity>

          {isPrivate && (
            <Input
              label="Şifre"
              value={password}
              onChangeText={setPassword}
              placeholder="Oda şifresini girin"
              secureTextEntry
              leftIcon={<Lock size={20} color={Colors.darkGray[400]} />}
            />
          )}

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            title="Oda Oluştur"
            onPress={handleCreate}
            variant="primary"
            size="large"
            isLoading={loading}
            style={styles.createButton}
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
  privateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.darkGray[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  privateText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  createButton: {
    marginTop: Spacing.md,
  },
});