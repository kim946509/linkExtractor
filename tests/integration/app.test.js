const request = require('supertest')
const app = require('../../src/app')

describe('App Integration Tests', () => {
  describe('GET /', () => {
    test('should return welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.body).toHaveProperty('message', 'LinkRadio Parsing Server')
      expect(response.body).toHaveProperty('documentation')
    })
  })

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('service', 'LinkRadio Parsing Server')
      expect(response.body).toHaveProperty('version')
    })
  })

  describe('GET /nonexistent', () => {
    test('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404)
    })
  })
})