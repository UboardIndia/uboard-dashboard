import type { SubmissionRow } from '@/types/sheets'
import type {
  ReadinessFurkan,
  PhysicalCountArjun,
  ReturnsArti,
  ReportData,
} from '@/types/api'

export function compileReport(
  submissions: SubmissionRow[],
  openingStock: number,
  totalInward: number,
  returnableOut: number,
  returned: number
): ReportData {
  const furkanSub = submissions.find((s) => s.submission_type === 'readiness_furkan')
  const arjunSub = submissions.find((s) => s.submission_type === 'physical_count_arjun')
  const artiSub = submissions.find((s) => s.submission_type === 'returns_arti')

  const furkan: ReadinessFurkan = furkanSub
    ? JSON.parse(furkanSub.data_json)
    : { closing_sellable: 0, closing_unassembled: 0, closing_defective: 0, closing_discontinued: 0, tranzact_verified: false }

  const arjun: PhysicalCountArjun = arjunSub
    ? JSON.parse(arjunSub.data_json)
    : { products: [], totals: { unassembled: 0, sellable: 0, defective: 0, discontinued: 0 } }

  const arti: ReturnsArti = artiSub
    ? JSON.parse(artiSub.data_json)
    : { amazon_initiated: 0, flipkart_initiated: 0 }

  // Use physical count as source of truth
  const sellable = arjun.totals.sellable
  const defective = arjun.totals.defective
  const unassembled = arjun.totals.unassembled
  const discontinued = arjun.totals.discontinued

  const returnsInTransit = arti.amazon_initiated + arti.flipkart_initiated

  // Core equation:
  // Opening + Inward = Sellable + Defective + Unassembled + Discontinued
  //                  + Dispatched + ReturnableOut + ReturnsInTransit + Returned
  // Dispatched = (Opening + Inward) - (Sellable + Defective + Unassembled + Discontinued
  //               + ReturnableOut + ReturnsInTransit + Returned)
  const totalOutward =
    sellable + defective + unassembled + discontinued + returnableOut + returnsInTransit + returned
  const dispatched =
    openingStock + totalInward - totalOutward

  const leakage =
    openingStock + totalInward -
    (sellable + defective + unassembled + discontinued + dispatched + returnableOut + returnsInTransit + returned)

  return {
    opening_stock: openingStock,
    total_inward: totalInward,
    total_outward: totalOutward,
    sellable,
    defective,
    unassembled,
    discontinued,
    dispatched: dispatched < 0 ? 0 : dispatched,
    returns_in_transit: returnsInTransit,
    returned,
    returnable_out: returnableOut,
    leakage,
    compiled_at: new Date().toISOString(),
    compiled_by: '',
  }
}

// Three-way comparison: Tranzact vs Physical
export interface ThreeWayRow {
  category: string
  tranzact: number
  physical: number
  match: boolean
}

export function threeWayComparison(
  furkan: ReadinessFurkan,
  arjun: PhysicalCountArjun
): ThreeWayRow[] {
  return [
    {
      category: 'Sellable',
      tranzact: furkan.closing_sellable,
      physical: arjun.totals.sellable,
      match: furkan.closing_sellable === arjun.totals.sellable,
    },
    {
      category: 'Unassembled',
      tranzact: furkan.closing_unassembled,
      physical: arjun.totals.unassembled,
      match: furkan.closing_unassembled === arjun.totals.unassembled,
    },
    {
      category: 'Defective',
      tranzact: furkan.closing_defective,
      physical: arjun.totals.defective,
      match: furkan.closing_defective === arjun.totals.defective,
    },
    {
      category: 'Discontinued',
      tranzact: furkan.closing_discontinued,
      physical: arjun.totals.discontinued,
      match: furkan.closing_discontinued === arjun.totals.discontinued,
    },
  ]
}
