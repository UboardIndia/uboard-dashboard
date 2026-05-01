import * as XLSX from 'xlsx'
import type { ThreeWayRow } from './report'
import type { ReportData } from '@/types/api'
import type { SubmissionRow } from '@/types/sheets'
import type { DefectsKashif } from '@/types/api'

export function generateReportXlsx(
  cycleMonth: string,
  report: ReportData,
  threeWay: ThreeWayRow[],
  submissions: SubmissionRow[]
): Buffer {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Core Report
  const reportData = [
    ['U-Board EV Inventory Reconciliation Report'],
    [`Cycle: ${cycleMonth} | Location: Okhla Factory Only`],
    [`Compiled: ${report.compiled_at} | By: ${report.compiled_by}`],
    [],
    ['Category', 'Value'],
    ['Opening Stock', report.opening_stock],
    ['Total Inward', report.total_inward],
    ['Sellable (Physical)', report.sellable],
    ['Unassembled (Physical)', report.unassembled],
    ['Defective (Physical)', report.defective],
    ['Discontinued (Physical)', report.discontinued],
    ['Dispatched', report.dispatched],
    ['Returnable Out', report.returnable_out],
    ['Returns In Transit', report.returns_in_transit],
    ['Returned', report.returned],
    [],
    ['LEAKAGE', report.leakage],
    [report.leakage !== 0 ? '⚠ NON-ZERO LEAKAGE — INVESTIGATE' : '✓ BALANCED'],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(reportData)
  XLSX.utils.book_append_sheet(wb, ws1, 'Reconciliation Report')

  // Sheet 2: Three-way Comparison
  const twData = [
    ['Three-Way Verification — Tranzact vs Physical'],
    ['Note: Physical count is source of truth. Tranzact should be corrected to match physical.'],
    [],
    ['Category', 'Tranzact', 'Physical', 'Match'],
    ...threeWay.map((r) => [r.category, r.tranzact, r.physical, r.match ? 'YES' : 'MISMATCH']),
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(twData)
  XLSX.utils.book_append_sheet(wb, ws2, 'Three-Way Verification')

  // Sheet 3: Defects (Kashif's submission)
  const kashifSub = submissions.find((s) => s.submission_type === 'defects_kashif')
  if (kashifSub) {
    const kashif: DefectsKashif = JSON.parse(kashifSub.data_json)
    const defData = [
      ['Defective Units Report'],
      ['Product', 'Qty', 'Type', 'Part Name / Missing Part'],
      ...kashif.items.map((i) => [i.product, i.qty, `Type ${i.type}`, i.part_name]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(defData)
    XLSX.utils.book_append_sheet(wb, ws3, 'Defective Units')
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

export function generateSalaryReportXlsx(
  cycleMonth: string,
  clearanceData: Array<{
    name: string
    tasks: Array<{ task_name: string; status: string; notes: string }>
    all_cleared: boolean
    release_status: string
  }>
): Buffer {
  const wb = XLSX.utils.book_new()

  const rows: unknown[][] = [
    ['U-Board Salary Clearance Report — CONFIDENTIAL'],
    [`Cycle: ${cycleMonth}`],
    [],
    ['Name', 'Task', 'Status', 'Notes', 'Salary Release'],
  ]
  for (const person of clearanceData) {
    for (const task of person.tasks) {
      rows.push([
        person.name,
        task.task_name,
        task.status,
        task.notes,
        person.release_status,
      ])
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Salary Report')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
