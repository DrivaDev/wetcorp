export const runtime = 'nodejs'

import { google } from 'googleapis'

export async function GET() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!privateKey || !clientEmail || !spreadsheetId) {
    return Response.json({
      ok: false,
      error: 'Faltan env vars',
      missing: {
        GOOGLE_PRIVATE_KEY: !privateKey,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: !clientEmail,
        GOOGLE_SHEETS_SPREADSHEET_ID: !spreadsheetId,
      },
    })
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:A1',
    })

    return Response.json({
      ok: true,
      message: 'Conexión exitosa con Google Sheets',
      spreadsheetId,
      clientEmail,
      cellA1: res.data.values?.[0]?.[0] ?? '(vacío)',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: msg })
  }
}
