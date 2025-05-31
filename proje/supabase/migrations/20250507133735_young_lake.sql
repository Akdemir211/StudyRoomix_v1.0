/*
  # Varsayılan Çalışma Odaları Ekleme

  1. Değişiklikler
    - Temel dersler için varsayılan çalışma odaları ekleme
    - Her ders için açıklamalı odalar
    - Tüm odalar public olarak ayarlanacak

  2. Güvenlik
    - Odalar herkes tarafından görülebilir
    - Katılım için şifre gerekmez
*/

-- Varsayılan çalışma odalarını ekle
INSERT INTO study_rooms (name, description, is_private, created_at)
VALUES
  (
    'Matematik',
    'Matematik problemleri ve formüller üzerinde birlikte çalışın. Geometri, Cebir, Analiz ve daha fazlası.',
    false,
    now()
  ),
  (
    'Fizik',
    'Mekanik, Elektrik-Manyetizma, Termodinamik konularında ortak çalışma alanı.',
    false,
    now()
  ),
  (
    'Kimya',
    'Organik Kimya, Anorganik Kimya ve laboratuvar çalışmaları için çalışma odası.',
    false,
    now()
  ),
  (
    'Biyoloji',
    'Hücre Biyolojisi, Genetik, Ekoloji ve diğer konularda birlikte çalışın.',
    false,
    now()
  ),
  (
    'Edebiyat',
    'Türk ve Dünya Edebiyatı, şiir ve roman analizleri için çalışma grubu.',
    false,
    now()
  ),
  (
    'Tarih',
    'Türkiye ve Dünya Tarihi konularında ortak çalışma ve tartışma alanı.',
    false,
    now()
  ),
  (
    'Coğrafya',
    'Fiziki ve Beşeri Coğrafya konularında çalışma ve tekrar odası.',
    false,
    now()
  ),
  (
    'İngilizce',
    'Gramer, kelime bilgisi ve konuşma pratiği için çalışma grubu.',
    false,
    now()
  )
ON CONFLICT DO NOTHING;