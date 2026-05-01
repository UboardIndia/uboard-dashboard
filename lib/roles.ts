import type { UserRole } from '@/types/sheets'

export function isAdmin(role: UserRole) { return role === 'admin' }
export function isReconciler(role: UserRole) { return role === 'reconciler' }
export function isSupervisor(role: UserRole) { return role === 'supervisor' }
export function isFactoryStaff(role: UserRole) { return role === 'factory_staff' }

export function canReadAllSubmissions(role: UserRole) {
  return role === 'reconciler' || role === 'supervisor' || role === 'admin'
}

export function canCompileReport(role: UserRole) { return role === 'reconciler' }
export function canSignOff(role: UserRole) { return role === 'supervisor' }
export function canMarkClearance(role: UserRole) { return role === 'reconciler' }
export function canManageUsers(role: UserRole) { return role === 'admin' }
export function canViewSalaryReport(role: UserRole) { return role === 'admin' }

// Submission types each user is allowed to submit
const ALLOWED_SUBMISSION_TYPES: Record<string, string> = {
  gopalji_id_placeholder: 'readiness_gopalji', // resolved by user lookup
}

export const SUBMISSION_TYPE_BY_NAME: Record<string, string> = {
  Gopalji: 'readiness_gopalji',
  Altab: 'readiness_altab',
  Furkan: 'readiness_furkan',
  Kashif: 'defects_kashif',
  Arjun: 'physical_count_arjun',
  Arti: 'returns_arti',
}
