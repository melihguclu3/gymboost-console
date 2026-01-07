export type UserRole = 'member' | 'admin' | 'trainer' | 'super_admin';
export type UserStatus = 'pending' | 'active' | 'inactive';
export type MembershipStatus = 'active' | 'expired' | 'cancelled';
export type PlanType = 'membership' | 'pt_package' | 'class_package' | 'swimming' | 'combat' | 'wellness' | 'hybrid';

// Ödeme tipleri
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'membership_balance';
export type PaymentStatus = 'completed' | 'pending' | 'cancelled';
export type MembershipPaymentStatus = 'pending' | 'partial' | 'paid';
export type PaymentType = 'membership' | 'store_sale' | 'balance_topup' | 'other';

// Alan Kiralama tipleri
export type RentalPaymentStatus = 'paid' | 'pending' | 'overdue';
export type RentalStatus = 'active' | 'expired' | 'cancelled';
export type RentalApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Gym {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export type Gender = 'male' | 'female' | 'other';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '0+' | '0-';

export interface User {
  id: string;
  gym_id: string | null;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  trainer_id?: string | null;
  avatar_url: string | null;
  qr_code: string | null;
  created_at: string;
  // Genişletilmiş bilgiler
  tc_identity: string | null;           // TC Kimlik No
  birth_date: string | null;            // Doğum tarihi
  gender: Gender | null;                // Cinsiyet
  address: string | null;               // Adres
  health_issues: string | null;         // Sağlık problemleri
  health_notes: string | null;          // Ek sağlık notları
  blood_type: BloodType | null;         // Kan grubu
  emergency_contact_name: string | null;    // Acil durum kişisi
  emergency_contact_phone: string | null;   // Acil durum telefonu
  emergency_contact_relation: string | null; // Yakınlık derecesi
  notes: string | null;                 // Admin notları
  profile_completed: boolean;           // Profil tamamlandı mı?
  profile_setup_completed: boolean;     // Hesap kurulumu tamamlandı mı? (Şifre belirleme vs.)
  weight: number | null;                // Kilo
  height: number | null;                // Boy (cm)
  balance: number;                      // Cüzdan Bakiyesi
  is_sales_authorized: boolean;         // Satış Yetkisi
  // Alan kiralama ile eklenen alanlar
  added_by_trainer_id?: string | null;        // Hangi PT ekledi
  rental_approval_status?: RentalApprovalStatus | null;  // Onay durumu
  approved_by_admin_id?: string | null;       // Onaylayan admin
  approved_at?: string | null;                // Onay tarihi
}

// Üyelik Planları - Salonun sunduğu paketler
export interface MembershipPlan {
  id: string;
  gym_id: string | null;
  name: string;                          // "Sabah Üyeliği", "Plus Üyelik", "10 Seans PT"
  description: string | null;
  plan_type: PlanType;
  duration_days: number | null;          // Üyelik süresi (gün)
  price: number;
  features: string[];                    // ["Fitness Salonu", "Havuz", "Sauna"]
  access_start_time: string | null;      // "06:00" - Sabah üyeliği için
  access_end_time: string | null;        // "12:00"
  session_count: number | null;          // PT paketleri için seans sayısı
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Üyelik - Kullanıcının satın aldığı paket
export interface Membership {
  id: string;
  user_id: string;
  gym_id: string;
  plan_id: string | null;                // Hangi plan satın alındı
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  plan_type: string | null;              // Eski alan - geriye uyumluluk
  price: number | null;
  sessions_remaining: number | null;     // PT için kalan seans
  sessions_used: number;                 // Kullanılan seans
  created_at: string;
  // Ödeme alanları
  total_amount: number | null;           // Toplam tutar
  paid_amount: number | null;            // Ödenen tutar
  payment_status: MembershipPaymentStatus; // Ödeme durumu
  // İlişkiler
  plan?: MembershipPlan;
}

// PT Seans Logları
export interface SessionLog {
  id: string;
  membership_id: string;
  user_id: string;
  trainer_id: string | null;
  session_date: string;
  notes: string | null;
  created_at: string;
  // İlişkiler
  trainer?: User;
}

export interface CheckIn {
  id: string;
  user_id: string;
  gym_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  method?: string | null;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  date: string;
  exercises: Exercise[];
  notes: string | null;
  duration: number | null;
  created_at: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

// Ödeme kaydı
export interface Payment {
  id: string;
  membership_id: string | null;
  user_id: string;
  gym_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentStatus;
  payment_type: PaymentType;
  description: string | null;
  receipt_no: string | null;
  created_by: string | null;
  created_at: string;
  // İlişkiler
  user?: User;
  membership?: Membership;
}

// =====================
// PT PANEL TYPES
// =====================

export type TargetMuscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type AppointmentType = 'training' | 'assessment' | 'consultation';

// Egzersiz (Veritabanı)
export interface ExerciseDB {
  id: string;
  gym_id: string | null;
  name: string;
  description: string | null;
  target_muscle: TargetMuscle | null;
  equipment: Equipment | null;
  difficulty: Difficulty;
  video_url: string | null;
  image_url: string | null;
  gif_url: string | null;
  instructions: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Antrenman şablonundaki egzersiz
export interface TemplateExercise {
  exercise_id: string;
  exercise_name?: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
  target_weight?: number;
}

// Antrenman Şablonu
export interface WorkoutTemplate {
  id: string;
  gym_id: string | null;
  trainer_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  duration_minutes: number;
  exercises: TemplateExercise[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // İlişkiler
  trainer?: User;
}

// Üyeye Atanmış Antrenman
export interface AssignedWorkout {
  id: string;
  gym_id: string | null;
  trainer_id: string | null;
  user_id: string;
  template_id: string | null;
  name: string;
  day_of_week: number | null;
  exercises: TemplateExercise[];
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  // İlişkiler
  user?: User;
  trainer?: User;
  template?: WorkoutTemplate;
}

// Antrenman Seansı (Canlı)
export interface WorkoutSession {
  id: string;
  gym_id: string | null;
  user_id: string;
  trainer_id: string | null;
  assigned_workout_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  rating: number | null;
  trainer_notes: string | null;
  created_at: string;
  // İlişkiler
  user?: User;
  trainer?: User;
  assigned_workout?: AssignedWorkout;
  set_logs?: SetLog[];
}

// Set Kaydı
export interface SetLog {
  id: string;
  session_id: string;
  exercise_id: string | null;
  exercise_name: string | null;
  set_number: number;
  target_reps: number | null;
  actual_reps: number | null;
  target_weight: number | null;
  actual_weight: number | null;
  rpe: number | null; // Rate of Perceived Exertion (1-10)
  rest_seconds: number | null;
  notes: string | null;
  completed_at: string;
}

// Vücut Ölçümü
export interface Measurement {
  id: string;
  gym_id: string | null;
  user_id: string;
  trainer_id: string | null;
  measured_at: string;
  weight: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  bmi: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  left_calf: number | null;
  right_calf: number | null;
  shoulders: number | null;
  neck: number | null;
  front_photo_url: string | null;
  right_side_photo_url: string | null;
  left_side_photo_url: string | null;
  back_photo_url: string | null;
  notes: string | null;
  created_at: string;
  // İlişkiler
  user?: User;
  trainer?: User;
}

// Beslenme Planı
export interface NutritionPlan {
  id: string;
  gym_id: string | null;
  user_id: string;
  trainer_id: string | null;
  daily_calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  notes: string | null;
  meal_plan?: string | null;
  meal_suggestions: { meal: string; items: string[] }[];
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused';
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  // İlişkiler
  user?: User;
  trainer?: User;
}

// PT Randevusu
export interface PTAppointment {
  id: string;
  gym_id: string | null;
  trainer_id: string;
  member_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes: string | null;
  member_notes: string | null;
  location: string | null;
  recurring_pattern: 'weekly' | 'biweekly' | null;
  parent_appointment_id: string | null;
  created_at: string;
  updated_at: string;
  // İlişkiler
  trainer?: User;
  member?: User;
}

// Envanter Tipleri
export type TransactionType = 'purchase' | 'sale' | 'adjustment' | 'waste' | 'return';

export interface Product {
  id: string;
  gym_id: string;
  name: string;
  category: 'beverage' | 'supplement' | 'snack' | 'equipment' | 'merchandise' | 'other';
  description?: string;
  sku?: string;
  barcode?: string;
  purchase_price?: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  unit: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  gym_id: string;
  product_id: string;
  transaction_type: TransactionType;
  quantity: number;
  unit_price: number | null;
  total_amount: number | null;
  payment_method: string | null;
  member_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // İlişkiler
  products?: Product;
  users?: User;
}

// Antrenör Müsaitliği
export interface TrainerAvailability {
  id: string;
  trainer_id: string;
  day_of_week: number; // 0-6 (Pazar-Cumartesi)
  start_time: string; // HH:mm
  end_time: string;
  is_available: boolean;
  created_at: string;
}

// Alan Kiralama
export interface TrainerSpaceRental {
  id: string;
  gym_id: string | null;
  trainer_id: string;
  start_date: string;
  end_date: string;
  monthly_fee: number;
  payment_status: RentalPaymentStatus;
  status: RentalStatus;
  max_clients: number;
  current_clients: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // İlişkiler
  trainer?: User;
}

export interface ExpiringMembership {
  id: string;
  user_id: string;
  end_date: string;
  users: {
    full_name: string;
    email: string;
  } | null;
}

export interface StaffMember {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
}

export interface Announcement {
  id: string;
  gym_id: string;
  title: string;
  content: string;
  type: 'general' | 'promotion' | 'event' | 'maintenance';
  is_active: boolean;
  published_at: string;
  created_at: string;
}

// =====================
// SUPER ADMIN TYPES
// =====================

// Super Admin Preferences (stored in user_metadata)
export interface SuperAdminPreferences {
  notifications: {
    newGymSignup: boolean;
    criticalErrors: boolean;
    weeklyReport: boolean;
    paymentAlerts: boolean;
  };
}

// AI Analysis Types
export type AIAnalysisType = 'platform' | 'health';

export interface AIAnalysisRequest {
  type: AIAnalysisType;
  data?: Record<string, unknown>;
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis: string;
  insights: string[];
  recommendations: string[];
  error?: string;
}
