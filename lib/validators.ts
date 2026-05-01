import { z } from 'zod'

export const LoginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
})

export const ResetPasswordSchema = z.object({
  user_id: z.string().uuid(),
  new_password: z.string().min(6),
})

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  role: z.enum(['factory_staff', 'supervisor', 'reconciler', 'admin']),
  password: z.string().min(6),
})

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['factory_staff', 'supervisor', 'reconciler', 'admin']).optional(),
  is_active: z.boolean().optional(),
  new_password: z.string().min(6).optional(),
})

export const ReadinessGopaljiSchema = z.object({
  tranzact_inward_ready: z.boolean(),
  tranzact_outward_ready: z.boolean(),
})

export const ReadinessAltabSchema = z.object({
  sheet_outward_ready: z.boolean(),
})

export const ReadinessFurkanSchema = z.object({
  tranzact_verified: z.boolean(),
  closing_sellable: z.number().min(0),
  closing_unassembled: z.number().min(0),
  closing_defective: z.number().min(0),
  closing_discontinued: z.number().min(0),
})

export const DefectItemSchema = z.object({
  product: z.string().min(1),
  qty: z.number().int().min(1),
  type: z.enum(['A', 'B']),
  part_name: z.string().min(1, 'Part name is mandatory for defective units'),
})

export const DefectsKashifSchema = z.object({
  items: z.array(DefectItemSchema).min(1),
})

export const PhysicalCountProductSchema = z.object({
  product: z.string().min(1),
  unassembled: z.number().min(0),
  sellable: z.number().min(0),
  defective: z.number().min(0),
  discontinued: z.number().min(0),
})

export const PhysicalCountArjunSchema = z.object({
  products: z.array(PhysicalCountProductSchema).min(1),
  totals: z.object({
    unassembled: z.number().min(0),
    sellable: z.number().min(0),
    defective: z.number().min(0),
    discontinued: z.number().min(0),
  }),
})

export const ReturnsArtiSchema = z.object({
  amazon_initiated: z.number().min(0),
  flipkart_initiated: z.number().min(0),
})

export const SubmitSchema = z.object({
  submission_type: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
})

export const ClearanceUpdateSchema = z.object({
  user_id: z.string().uuid(),
  task_name: z.string().min(1),
  status: z.enum(['cleared', 'pending']),
  notes: z.string().optional(),
})

export const ReminderSchema = z.object({
  user_id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  message: z.string().min(1),
})

export const CreateCycleSchema = z.object({
  cycle_month: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
})
