require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const logger = require('./config/logger')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(cors())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'LinkRadio Parsing Server',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
const { router: parseRoutes, initializeRoutes } = require('./routes/parseRoutes')
app.use('/api/v1', parseRoutes)

app.get('/', (req, res) => {
  res.json({
    message: 'LinkRadio Parsing Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      parserHealth: '/api/v1/health',
      parse: 'POST /api/v1/parse',
      batchParse: 'POST /api/v1/parse/batch',
      strategies: 'GET /api/v1/strategies'
    }
  })
})

// Error handling middleware (should be last)
app.use(errorHandler)

// Initialize routes and start server
async function startServer() {
  try {
    await initializeRoutes()

    const server = app.listen(PORT, () => {
      logger.info(`LinkRadio Parsing Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info('API endpoints available:')
      logger.info('  GET  / - Service information')
      logger.info('  GET  /health - Health check')
      logger.info('  POST /api/v1/parse - Parse single URL')
      logger.info('  POST /api/v1/parse/batch - Parse multiple URLs')
      logger.info('  GET  /api/v1/strategies - Get available parsing strategies')
      logger.info('  GET  /api/v1/health - Parser health check')
    })

    return server
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

const server = startServer()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  const serverInstance = await server
  serverInstance.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

module.exports = app