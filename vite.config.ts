import dns from 'dns'
import { defineConfig } from 'vite'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    {
      name: 'Origin-Trial',
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Origin-Trial', 'AlsgHBaJPdlZ24pkroBSkRHFeYGm+p7QxSiR0reBTV2f60MRKX1GxaJzJHIljZNapPCIuz7+mIGQ2xQFKEaUTgYAAABJeyJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJmZWF0dXJlIjoiV2ViR1BVIiwiZXhwaXJ5IjoxNjc1MjA5NTk5fQ==')
          next()
        })
      },
    },
  ],
})
