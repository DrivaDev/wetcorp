export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/mongodb'
import { OC } from '@/lib/models/OC'
import { google } from 'googleapis'
import Decimal from 'decimal.js'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ocId = searchParams.get('ocId')
  if (!ocId) return Response.json({ error: 'Falta ?ocId=...' }, { status: 400 })

  const steps: Record<string, unknown> = {}

  try {
    await connectDB()
    steps.db = 'ok'

    const doc = await OC.findById(ocId).lean() as Record<string, unknown> | null
    if (!doc) return Response.json({ error: 'OC no encontrada' })
    steps.oc = { referenciaOC: (doc as { referenciaOC: string }).referenciaOC }

    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    steps.envVars = { privateKey: !!privateKey, clientEmail: !!clientEmail, spreadsheetId: !!spreadsheetId, parentFolderId: !!parentFolderId }

    if (!privateKey || !clientEmail || !spreadsheetId) {
      return Response.json({ error: 'Faltan vars de Google', steps })
    }

    const gauth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, '\n') },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    })
    steps.auth = 'ok'

    const { v2: cld } = await import('cloudinary')
    cld.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    steps.cloudinary = 'configured'

    // Test Drive
    if (parentFolderId) {
      const drive = google.drive({ version: 'v3', auth: gauth })
      try {
        const folderSearch = await drive.files.list({
          q: `'${parentFolderId}' in parents and trashed = false`,
          fields: 'files(id,name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          pageSize: 3,
        })
        steps.drive = { ok: true, existingFiles: folderSearch.data.files?.length ?? 0 }
      } catch (driveErr) {
        steps.drive = { ok: false, error: driveErr instanceof Error ? driveErr.message : String(driveErr) }
      }
    }

    // Test Sheets write
    const sheets = google.sheets({ version: 'v4', auth: gauth })
    try {
      await sheets.spreadsheets.values.get({ spreadsheetId, range: 'C1:C1' })
      steps.sheets = 'ok'
    } catch (sheetsErr) {
      steps.sheets = { ok: false, error: sheetsErr instanceof Error ? sheetsErr.message : String(sheetsErr) }
    }

    // Test Cloudinary fetch
    const documentos = (doc as { documentos?: Record<string, string | null> }).documentos ?? {}
    const firstDocUrl = Object.values(documentos).find(v => !!v)
    if (firstDocUrl) {
      try {
        const match = firstDocUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
        if (match) {
          const publicId = match[1]
          const signed = cld.utils.private_download_url(publicId, 'pdf', {
            resource_type: 'raw', type: 'upload', expires_at: Math.floor(Date.now() / 1000) + 300
          })
          const res = await fetch(signed)
          steps.cloudinaryFetch = { status: res.status, ok: res.ok, url: signed.substring(0, 80) + '...' }
        }
      } catch (cErr) {
        steps.cloudinaryFetch = { error: cErr instanceof Error ? cErr.message : String(cErr) }
      }
    } else {
      steps.cloudinaryFetch = 'no documents in OC'
    }

    return Response.json({ ok: true, steps })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err), steps })
  }
}
