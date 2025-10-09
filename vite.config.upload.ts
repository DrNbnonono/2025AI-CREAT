import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 简单的上传中间件
function uploadMiddleware() {
  return {
    name: 'upload-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/upload-model', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks)
            const boundary = req.headers['content-type']?.split('boundary=')[1]
            if (!boundary) {
              throw new Error('No boundary in multipart data')
            }

            // 简单解析 multipart/form-data
            const parts = buffer.toString('binary').split(`--${boundary}`)
            let filename = ''
            let fileData: Buffer | null = null

            for (const part of parts) {
              if (part.includes('filename=')) {
                const match = part.match(/filename="(.+?)"/)
                if (match) filename = match[1]
                
                const dataStart = part.indexOf('\r\n\r\n') + 4
                const dataEnd = part.lastIndexOf('\r\n')
                if (dataStart > 3 && dataEnd > dataStart) {
                  fileData = Buffer.from(part.slice(dataStart, dataEnd), 'binary')
                }
              }
            }

            if (!filename || !fileData) {
              throw new Error('Invalid file data')
            }

            // 保存到 public/models/uploaded
            const uploadDir = path.join(__dirname, 'public', 'models', 'uploaded')
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true })
            }

            const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
            const filePath = path.join(uploadDir, safeName)
            fs.writeFileSync(filePath, fileData)

            const relativePath = `/models/uploaded/${safeName}`
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              success: true, 
              path: relativePath,
              filename: safeName 
            }))
          } catch (error: any) {
            console.error('Upload error:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: error.message }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), uploadMiddleware()],
  server: {
    port: 5173,
    host: true,
  },
})

