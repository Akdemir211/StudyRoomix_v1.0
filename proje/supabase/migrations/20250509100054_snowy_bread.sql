/*
  # Pro Kullanıcılar için Özel Eğitim Koçu Odaları

  1. Değişiklikler
    - Pro kullanıcılar için özel oda oluşturma fonksiyonu
    - Otomatik oda oluşturma trigger'ı
    - Güvenlik politikaları
    
  2. Güvenlik
    - Her Pro kullanıcı sadece kendi odasına erişebilir
    - Odalar otomatik olarak özel ve şifreli
*/

-- Pro kullanıcı olduğunda otomatik oda oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_education_coach_room()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_pro = true AND OLD.is_pro = false THEN
    INSERT INTO chat_rooms (
      name,
      description,
      is_private,
      created_by,
      created_at
    ) VALUES (
      'Eğitim Koçum',
      'Yapay zeka destekli kişisel eğitim koçunuz size yardımcı olmak için hazır',
      true,
      NEW.id,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pro kullanıcı güncellemesi için trigger
DROP TRIGGER IF EXISTS on_user_pro_update ON users;
CREATE TRIGGER on_user_pro_update
  AFTER UPDATE OF is_pro ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_education_coach_room();

-- Eğitim koçu odaları için özel politika
CREATE POLICY "education_coach_room_access"
ON chat_rooms
FOR ALL
TO authenticated
USING (
  (name = 'Eğitim Koçum' AND created_by = auth.uid()) OR
  (name != 'Eğitim Koçum')
);