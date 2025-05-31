import { supabase } from './supabase';

// Kullanıcı bilgileri tipi
export interface UserInfo {
  id: string;
  name?: string | null;
  grade?: string | null;
  targetProfession?: string | null;
  examScore?: number | null;
  strongSubjects?: string[] | null;
  weakSubjects?: string[] | null;
  assignments?: UserAssignment[];
}

// Ödev tipi
export interface UserAssignment {
  id: string;
  userId: string;
  description: string;
  subject: string;
  dueDate: Date;
  isCompleted: boolean;
  createdAt: Date;
}

// Mesaj tipi
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Kullanıcı bilgilerini getir
 */
export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, grade, target_profession, exam_score, strong_subjects, weak_subjects')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    const { data: assignmentsData, error: assignmentError } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false });
    
    if (assignmentError) throw assignmentError;

    return {
      id: userData.id,
      name: userData.name,
      grade: userData.grade,
      targetProfession: userData.target_profession,
      examScore: userData.exam_score,
      strongSubjects: userData.strong_subjects,
      weakSubjects: userData.weak_subjects,
      assignments: assignmentsData.map(a => ({
        id: a.id,
        userId: a.user_id,
        description: a.description,
        subject: a.subject,
        dueDate: new Date(a.due_date),
        isCompleted: a.is_completed,
        createdAt: new Date(a.created_at)
      }))
    };
  } catch (error) {
    console.error('Kullanıcı bilgisi getirme hatası:', error);
    return null;
  }
}

/**
 * Kullanıcı bilgilerini güncelle
 */
export async function updateUserInfo(
  userId: string, 
  userInfo: Partial<Omit<UserInfo, 'id' | 'assignments'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: userInfo.name,
        grade: userInfo.grade,
        target_profession: userInfo.targetProfession,
        exam_score: userInfo.examScore,
        strong_subjects: userInfo.strongSubjects,
        weak_subjects: userInfo.weakSubjects
      })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return false;
  }
}

/**
 * Kullanıcı ödevi oluştur
 */
export async function createAssignment(
  userId: string,
  assignment: Omit<UserAssignment, 'id' | 'userId' | 'createdAt'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_assignments')
      .insert({
        user_id: userId,
        description: assignment.description,
        subject: assignment.subject,
        due_date: assignment.dueDate.toISOString(),
        is_completed: assignment.isCompleted,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Ödev oluşturma hatası:', error);
    return null;
  }
}

/**
 * Ödev durumunu güncelle
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  isCompleted: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_assignments')
      .update({ is_completed: isCompleted })
      .eq('id', assignmentId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Ödev güncelleme hatası:', error);
    return false;
  }
}

/**
 * Sohbet geçmişini getir
 */
export async function getChatHistory(
  userId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(message => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      timestamp: new Date(message.created_at)
    }));
  } catch (error) {
    console.error('Sohbet geçmişi getirme hatası:', error);
    return [];
  }
}

/**
 * Mesaj ekle
 */
export async function addChatMessage(
  userId: string,
  message: Omit<ChatMessage, 'id'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .insert({
        user_id: userId,
        role: message.role,
        content: message.content,
        created_at: message.timestamp.toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Mesaj ekleme hatası:', error);
    return null;
  }
}

/**
 * Sohbet geçmişini temizle
 */
export async function clearChatHistory(userId: string): Promise<boolean> {
  try {
    // Selamlama mesajı dışındaki tüm mesajları sil
    const { error } = await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', userId)
      .neq('role', 'greeting');

    if (error) throw error;
    
    // Yeni selamlama mesajı ekle
    const greetingMessage: Omit<ChatMessage, 'id'> = {
      role: 'assistant',
      content: 'Merhaba! Ben senin yapay zeka destekli eğitim koçunum. Ders çalışma, sınavlara hazırlanma veya herhangi bir konuda sana yardımcı olabilirim. Seni daha iyi tanıyabilir miyim?',
      timestamp: new Date()
    };

    await addChatMessage(userId, greetingMessage);
    return true;
  } catch (error) {
    console.error('Sohbet geçmişi temizleme hatası:', error);
    return false;
  }
}