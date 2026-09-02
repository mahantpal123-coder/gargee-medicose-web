import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

if (fs.existsSync('.env')) {
  const envConfig = fs.readFileSync('.env', 'utf-8')
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=')
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim()
      }
    }
  })
}

function localApiPlugin() {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()

        try {
          const apiName = req.url.split('/api/')[1].split('?')[0]
          const filePath = path.resolve(`./api/${apiName}.js`)

          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            return res.end(JSON.stringify({ error: 'API route not found' }))
          }

          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              if (body) req.body = JSON.parse(body)
            } catch (e) {
              req.body = {}
            }

            res.status = (code) => {
              res.statusCode = code
              return res
            }
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
              return res
            }

            try {
              const mod = await server.ssrLoadModule(`./api/${apiName}.js`)
              await mod.default(req, res)
            } catch (err) {
              console.error('Local API error:', err)
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        } catch (err) {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localApiPlugin()
  ],
})
