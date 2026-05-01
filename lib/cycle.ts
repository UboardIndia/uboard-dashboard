import { Cycles, Submissions } from './sheets'
import type { CycleRow, SubmissionRow } from '@/types/sheets'

export async function getActiveCycle(): Promise<CycleRow | null> {
  const all = await Cycles.all()
  // Most recent non-signed-off cycle
  const active = all
    .filter((c) => c.status !== 'signed_off')
    .sort((a, b) => b.cycle_month.localeCompare(a.cycle_month))
  return active[0] ?? null
}

export async function getCycleById(id: string): Promise<CycleRow | null> {
  const result = await Cycles.byId(id)
  return result?.row ?? null
}

// Returns all submissions for a cycle as plain rows
export async function getSubmissionsForCycle(cycleId: string): Promise<SubmissionRow[]> {
  const results = await Submissions.byCycleId(cycleId)
  return results.map((r) => r.row)
}

// Check if all required submissions are present for a cycle
export function getMissingSubmissions(submissions: SubmissionRow[]): string[] {
  const required = [
    'readiness_gopalji',
    'readiness_altab',
    'readiness_furkan',
    'defects_kashif',
    'physical_count_arjun',
    'returns_arti',
  ]
  const present = submissions.map((s) => s.submission_type)
  return required.filter((r) => !present.includes(r))
}

export function isCycleFrozenOrSignedOff(cycle: CycleRow): boolean {
  return cycle.status === 'frozen' || cycle.status === 'signed_off'
}

export function isCycleSignedOff(cycle: CycleRow): boolean {
  return cycle.status === 'signed_off'
}
