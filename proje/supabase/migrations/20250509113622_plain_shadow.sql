/*
  # Eğitim Koçu Odası Kaldırma

  1. Değişiklikler
    - Eğitim koçu odasını kaldırma
    - İlgili trigger ve fonksiyonları kaldırma
    - Politikaları güncelleme
*/

-- Eğitim koçu odasını sil
DELETE FROM chat_rooms WHERE name = 'Eğitim Koçum';

-- Trigger'ı kaldır
DROP TRIGGER IF EXISTS on_user_pro_update ON users;

-- Fonksiyonu kaldır
DROP FUNCTION IF EXISTS create_education_coach_room;