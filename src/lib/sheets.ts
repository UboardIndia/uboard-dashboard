import { google } from "googleapis";

/**
 * Google Sheets data layer.
 *
 * Authenticates with a service account and exposes typed read helpers.
 * Server-only — never import this from a client component.
 */

const SHEET_ID = process.env.GOOGLE_SHEET_ID_MAIN;

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // .env files store the private key with `\n` escapes; convert back to real newlines.
  // (Harmless if the loader already expanded them.)
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Missing Google service account credentials. " +
        "Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local",
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Read column A of Sheet1, skipping the header row.
 * Returns an array of names (or whatever string values are in that column).
 */
export async function getNames(): Promise<string[]> {
  if (!SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID_MAIN env var");
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A2:A", // skip header in A1
  });

  const rows = response.data.values ?? [];
  // Each row is an array of cell values; we want the first column of each row.
  return rows.map((row) => row[0]).filter(Boolean) as string[];
}
