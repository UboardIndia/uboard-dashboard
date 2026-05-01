import { google } from 'googleapis'
import type {
  UserRow,
  CycleRow,
  SubmissionRow,
  ClearanceStatusRow,
  ReconciliationReportRow,
  EscalationRow,
  NotificationRow,
  LoginDenyListRow,
  LoginFailCounterRow,
} from '@/types/sheets'

const SHEET_ID = process.env.GOOGLE_SHEET_ID_MAIN!

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheetsClient() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

// Read all rows from a tab (returns array of objects keyed by header row)
export async function readSheet<T>(tabName: string): Promise<T[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tabName,
  })
  const rows = res.data.values
  if (!rows || rows.length < 2) return []
  const headers = rows[0] as string[]
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
    return obj as T
  })
}

// Append a new row to a tab
export async function appendRow(tabName: string, row: Record<string, string>): Promise<void> {
  const sheets = await getSheetsClient()
  const headers = await getHeaders(tabName)
  const values = [headers.map((h) => row[h] ?? '')]
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tabName,
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

// Update a specific row by 1-based row index (header = row 1, data starts at row 2)
export async function updateRow(
  tabName: string,
  rowIndex: number, // 1-based, data rows start at 2
  row: Record<string, string>
): Promise<void> {
  const sheets = await getSheetsClient()
  const headers = await getHeaders(tabName)
  const values = [headers.map((h) => row[h] ?? '')]
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

// Delete a data row by replacing with blanks then shifting — simplified: overwrite with empty
export async function deleteRow(tabName: string, rowIndex: number): Promise<void> {
  const sheets = await getSheetsClient()
  const headers = await getHeaders(tabName)
  const blanks = [headers.map(() => '')]
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: blanks },
  })
}

async function getHeaders(tabName: string): Promise<string[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!1:1`,
  })
  return (res.data.values?.[0] as string[]) ?? []
}

// Find first row matching a field value — returns { row, rowIndex } (rowIndex is 1-based sheet row)
export async function findRow<T>(
  tabName: string,
  field: keyof T & string,
  value: string
): Promise<{ row: T; rowIndex: number } | null> {
  const rows = await readSheet<T>(tabName)
  const idx = rows.findIndex((r) => (r as Record<string, string>)[field] === value)
  if (idx === -1) return null
  return { row: rows[idx], rowIndex: idx + 2 } // +2: header row + 0-based
}

// Find all rows matching a field value
export async function findRows<T>(
  tabName: string,
  field: keyof T & string,
  value: string
): Promise<Array<{ row: T; rowIndex: number }>> {
  const rows = await readSheet<T>(tabName)
  const results: Array<{ row: T; rowIndex: number }> = []
  rows.forEach((r, idx) => {
    if ((r as Record<string, string>)[field] === value) {
      results.push({ row: r, rowIndex: idx + 2 })
    }
  })
  return results
}

// ── Typed convenience helpers ───────────────────────────────────────────────

export const Users = {
  all: () => readSheet<UserRow>('users'),
  byPhone: (phone: string) => findRow<UserRow>('users', 'phone', phone),
  byId: (id: string) => findRow<UserRow>('users', 'id', id),
  append: (row: UserRow) => appendRow('users', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: UserRow) =>
    updateRow('users', rowIndex, row as unknown as Record<string, string>),
}

export const Cycles = {
  all: () => readSheet<CycleRow>('cycles'),
  byId: (id: string) => findRow<CycleRow>('cycles', 'id', id),
  append: (row: CycleRow) => appendRow('cycles', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: CycleRow) =>
    updateRow('cycles', rowIndex, row as unknown as Record<string, string>),
}

export const Submissions = {
  all: () => readSheet<SubmissionRow>('submissions'),
  byCycleId: (cycleId: string) => findRows<SubmissionRow>('submissions', 'cycle_id', cycleId),
  byId: (id: string) => findRow<SubmissionRow>('submissions', 'id', id),
  append: (row: SubmissionRow) => appendRow('submissions', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: SubmissionRow) =>
    updateRow('submissions', rowIndex, row as unknown as Record<string, string>),
  delete: (rowIndex: number) => deleteRow('submissions', rowIndex),
}

export const ClearanceStatus = {
  all: () => readSheet<ClearanceStatusRow>('clearance_status'),
  byCycleId: (cycleId: string) =>
    findRows<ClearanceStatusRow>('clearance_status', 'cycle_id', cycleId),
  append: (row: ClearanceStatusRow) =>
    appendRow('clearance_status', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: ClearanceStatusRow) =>
    updateRow('clearance_status', rowIndex, row as unknown as Record<string, string>),
}

export const ReconciliationReports = {
  all: () => readSheet<ReconciliationReportRow>('reconciliation_report'),
  byCycleId: (cycleId: string) =>
    findRow<ReconciliationReportRow>('reconciliation_report', 'cycle_id', cycleId),
  append: (row: ReconciliationReportRow) =>
    appendRow('reconciliation_report', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: ReconciliationReportRow) =>
    updateRow('reconciliation_report', rowIndex, row as unknown as Record<string, string>),
}

export const Escalations = {
  all: () => readSheet<EscalationRow>('escalations'),
  byCycleId: (cycleId: string) => findRows<EscalationRow>('escalations', 'cycle_id', cycleId),
  append: (row: EscalationRow) => appendRow('escalations', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: EscalationRow) =>
    updateRow('escalations', rowIndex, row as unknown as Record<string, string>),
}

export const Notifications = {
  all: () => readSheet<NotificationRow>('notifications'),
  byRecipient: (userId: string) =>
    findRows<NotificationRow>('notifications', 'recipient_id', userId),
  append: (row: NotificationRow) =>
    appendRow('notifications', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: NotificationRow) =>
    updateRow('notifications', rowIndex, row as unknown as Record<string, string>),
}

export const LoginDenyList = {
  all: () => readSheet<LoginDenyListRow>('login_deny_list'),
  byToken: (token: string) => findRow<LoginDenyListRow>('login_deny_list', 'token', token),
  append: (row: LoginDenyListRow) =>
    appendRow('login_deny_list', row as unknown as Record<string, string>),
}

export const LoginFailCounter = {
  all: () => readSheet<LoginFailCounterRow>('login_fail_counter'),
  byPhone: (phone: string) => findRow<LoginFailCounterRow>('login_fail_counter', 'phone', phone),
  append: (row: LoginFailCounterRow) =>
    appendRow('login_fail_counter', row as unknown as Record<string, string>),
  update: (rowIndex: number, row: LoginFailCounterRow) =>
    updateRow('login_fail_counter', rowIndex, row as unknown as Record<string, string>),
}
