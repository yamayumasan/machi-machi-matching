import { describe, it, expect } from '@jest/globals'
import request from 'supertest'
import { createTestApp } from '../helpers/testApp.js'
import { categoriesRouter } from '../../routes/categories.js'

describe('Categories API', () => {
  const app = createTestApp()
  app.use('/api/categories', categoriesRouter)

  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      const response = await request(app).get('/api/categories')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)

      // 各カテゴリの構造を確認
      const category = response.body.data[0]
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('icon')
      expect(category).toHaveProperty('sortOrder')
    })

    it('should return categories with correct structure', async () => {
      const response = await request(app).get('/api/categories')

      expect(response.status).toBe(200)

      response.body.data.forEach((category: { id: string; name: string; icon: string; sortOrder: number }, index: number) => {
        expect(typeof category.id).toBe('string')
        expect(typeof category.name).toBe('string')
        expect(typeof category.icon).toBe('string')
        expect(category.sortOrder).toBe(index)
      })
    })
  })
})
