import { createClient } from '@/lib/supabase/client';

export type LogEventType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_DELETE'
  | 'BULK_UPDATE'
  | 'ANNOUNCEMENT'
  | 'PAYMENT'
  | 'SETTINGS_CHANGE'
  | 'EXPORT';

export type LogEntity = 
  | 'users'
  | 'memberships'
  | 'payments'
  | 'products'
  | 'inventory'
  | 'workout_sessions'
  | 'check_ins'
  | 'system_settings';

interface LogActivityParams {
  eventType: LogEventType;
  entityType: LogEntity;
  entityId?: string; // Tekil işlemse ID
  message: string;
  metadata?: Record<string, any>; // Detaylı veri (örn: silinenlerin listesi)
}

/**
 * Kullanıcı işlemlerini veritabanına loglar.
 * Otomatik trigger'lar dışında, mantıksal işlemleri (örn: "Toplu Silme Başlattı") kaydetmek için kullanılır.
 */
export async function logActivity({
  eventType,
  entityType,
  entityId,
  message,
  metadata = {}
}: LogActivityParams) {
  try {
    const supabase = createClient();
    
    // Aktif kullanıcıyı al
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Kullanıcının rolünü ve gym_id'sini al (Context'ten veya DB'den)
    // Client-side olduğu için DB'den çekmek daha güvenli
    const { data: userData } = await supabase
      .from('users')
      .select('gym_id, role, email, gym:gyms(name)')
      .eq('id', user.id)
      .single();

    if (!userData) return;

    const gymName = Array.isArray(userData.gym) 
      ? userData.gym[0]?.name 
      : (userData.gym as any)?.name;

    const { error } = await supabase.from('system_logs').insert({
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId ? entityId : null, // UUID formatı için boş string yerine null
      message: message,
      metadata: metadata,
      actor_user_id: user.id,
      actor_role: userData.role,
      gym_id: userData.gym_id,
      gym_name: gymName,
      user_email: userData.email,
    });

    if (error) {
      console.error('Loglama hatası:', error);
    }
  } catch (error) {
    console.error('Loglama servisi hatası:', error);
  }
}
