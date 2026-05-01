export type UserRole = 'factory_staff' | 'supervisor' | 'reconciler' | 'admin'

export interface UserRow {
  id: string
  name: string
  phone: string
  role: UserRole
  password_hash: string
  is_active: string // 'true' | 'false'
  created_at: string
  last_login: string
}

export type CycleStatus = 'active' | 'frozen' | 'signed_off'

export interface CycleRow {
  id: string
  cycle_month: string // 'YYYY-MM'
  status: CycleStatus
  created_at: string
  frozen_at: string
  signed_off_at: string
  signed_off_by: string
}

export interface SubmissionRow {
  id: string
  cycle_id: string
  user_id: string
  submission_type: string
  data_json: string
  submitted_at: string
  is_locked: string // 'true' | 'false'
}

export type ClearanceTaskStatus = 'cleared' | 'pending'

export interface ClearanceStatusRow {
  id: string
  cycle_id: string
  user_id: string
  task_name: string
  status: ClearanceTaskStatus
  updated_by: string
  updated_at: string
  notes: string
}

export interface ReconciliationReportRow {
  id: string
  cycle_id: string
  opening_stock: string
  total_inward: string
  total_outward: string
  sellable: string
  defective: string
  unassembled: string
  discontinued: string
  dispatched: string
  returns_in_transit: string
  returned: string
  returnable_out: string
  leakage: string
  compiled_at: string
  compiled_by: string
}

export interface EscalationRow {
  id: string
  cycle_id: string
  raised_by: string
  raised_at: string
  notes: string
  resolved_at: string
  resolved_by: string
}

export interface NotificationRow {
  id: string
  recipient_id: string
  cycle_id: string
  type: string
  message: string
  is_read: string // 'true' | 'false'
  created_at: string
}

export interface LoginDenyListRow {
  token: string
  invalidated_at: string
}

export interface LoginFailCounterRow {
  phone: string
  fail_count: string
  locked_until: string
}
