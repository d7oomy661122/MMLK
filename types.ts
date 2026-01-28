
export interface User {
  id: string;
  username: string;
  phone: string;
  balance: number;
  role: string; // 'user' | 'admin'
  vip_level: number; // 0 = Intern, 1 = VIP 1, etc.
  referral_code: string;
  referral_by: string | null;
  referral_count: number;
  total_referral_profit: number;
  today_referral_profit: number;
  vip_joined_at?: string; // Date string
  intern_started_at?: string; // Date string for Intern expiry tracking
  created_at: string;
  luck_card_attempts: number;
}

export interface VipLevel {
  id: number;
  level: number;
  name: string;
  price: number;
  daily_tasks: number;
  daily_income: number;
  monthly_income: number;
  monthly_tasks?: number; 
}

export interface Task {
  id: number;
  title: string;
  reward: number;
  is_active: boolean;
  landing_url: string;
  duration_seconds: number;
  vip_level: number; // CHANGED: Strict Integer
  display_level?: string; // Optional UI helper from RPC
  created_at?: string;
  is_completed_today?: boolean; // From RPC
}

export interface UserTask {
  id: number;
  user_id: string;
  task_id: number;
  status: 'completed' | 'pending';
  completed_at: string;
  created_at: string;
}

export interface AuthError {
  message: string;
}

export interface WithdrawalMethod {
  id: string;
  user_id: string;
  full_name: string;
  bank_name: string; 
  account_number: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  amount: number;
  full_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DepositInfo {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  transfer_reason?: string;
  is_active: boolean;
}

export interface UserDeposit {
  id: string;
  user_id: string;
  payment_method: string;
  full_name: string;
  rib: string;
  amount: number;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  referral_processed?: boolean;
  approved?: boolean; // Logic field
  processed_at?: string; // Audit field
}
