import request from 'supertest'
import { createTestApp } from '../helpers/testApp.js'
import { healthRouter } from '../../routes/health.js'

describe('Health API', () => {
  const app = createTestApp()
  app.use('/api/health', healthRouter)

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('status', 'ok')
      expect(response.body.data).toHaveProperty('timestamp')
    })
  })
})
