export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { google } from 'googleapis'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID

  if (!privateKey || !clientEmail) {
    return Response.json({ error: 'Faltan GOOGLE_PRIVATE_KEY o GOOGLE_SERVICE_ACCOUNT_EMAIL' })
  }
  if (!parentFolderId) {
    return Response.json({ error: 'Falta GOOGLE_DRIVE_PARENT_FOLDER_ID' })
  }

  try {
    const gauth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth: gauth })

    // Listar archivos en la carpeta padre para verificar acceso (supportsAllDrives para Shared Drives)
    const res = await drive.files.list({
      q: `'${parentFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 5,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    // Crear carpeta de prueba
    const testFolder = await drive.files.create({
      requestBody: {
        name: 'TEST_DRIVE_OK',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id, name',
      supportsAllDrives: true,
    })

    // Intentar borrar carpeta de prueba (puede fallar si el rol es Contributor — no bloquea el sync)
    try {
      await drive.files.delete({ fileId: testFolder.data.id!, supportsAllDrives: true })
    } catch {
      // Contributor no puede borrar en Shared Drive — OK para nuestro uso
    }

    return Response.json({
      ok: true,
      message: 'Drive API OK — crear carpeta funciona (delete omitido si rol es Contributor)',
      parentFolderId,
      clientEmail,
      existingFiles: res.data.files?.map(f => ({ name: f.name, type: f.mimeType })) ?? [],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: msg })
  }
}
