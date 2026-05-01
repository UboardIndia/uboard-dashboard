import type { UserRole } from './sheets'

export interface JwtPayload {
  userId: string
  name: string
  role: UserRole
  iat: number
  exp: number
}

export interface ApiUser {
  id: string
  name: string
  role: UserRole
}

// Submission data shapes

export interface ReadinessGopalji {
  tranzact_inward_ready: boolean
  tranzact_outward_ready: boolean
}

export interface ReadinessAltab {
  sheet_outward_ready: boolean
}

export interface ReadinessFurkan {
  tranzact_verified: boolean
  closing_sellable: number
  closing_unassembled: number
  closing_defective: number
  closing_discontinued: number
}

export interface DefectItem {
  product: string
  qty: number
  type: 'A' | 'B'
  part_name: string
}

export interface DefectsKashif {
  items: DefectItem[]
}

export interface PhysicalCountProduct {
  product: string
  unassembled: number
  sellable: number
  defective: number
  discontinued: number
}

export interface PhysicalCountArjun {
  products: PhysicalCountProduct[]
  totals: {
    unassembled: number
    sellable: number
    defective: number
    discontinued: number
  }
}

export interface ReturnsArti {
  amazon_initiated: number
  flipkart_initiated: number
}

export type SubmissionData =
  | ReadinessGopalji
  | ReadinessAltab
  | ReadinessFurkan
  | DefectsKashif
  | PhysicalCountArjun
  | ReturnsArti

// Report
export interface ReportData {
  opening_stock: number
  total_inward: number
  total_outward: number
  sellable: number
  defective: number
  unassembled: number
  discontinued: number
  dispatched: number
  returns_in_transit: number
  returned: number
  returnable_out: number
  leakage: number
  compiled_at: string
  compiled_by: string
}

// Clearance
export interface ClearanceTask {
  task_name: string
  status: 'cleared' | 'pending'
  updated_at: string
  notes: string
}

export interface UserClearance {
  user_id: string
  name: string
  tasks: ClearanceTask[]
  all_cleared: boolean
}
