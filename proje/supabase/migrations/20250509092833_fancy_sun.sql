/*
  # Eğitim Koçu Odası Ekleme

  1. Değişiklikler
    - Eğitim koçu odası için yeni kayıt ekleme
    
  2. Güvenlik
    - Oda özel olarak işaretlendi
    - Sadece pro kullanıcılar erişebilecek
*/

-- Eğitim koçu odasını ekle
INSERT INTO chat_rooms (name, description, is_private, created_at)
VALUES (
  'Eğitim Koçum',
  'Yapay zeka destekli eğitim koçunuz size yardımcı olmak için hazır',
  true,
  now()
)
ON CONFLICT DO NOTHING;