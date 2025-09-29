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

// API routes will be added here
app.get('/', (req, res) => {
  res.json({
    message: 'LinkRadio Parsing Server',
    documentation: '/health for health check'
  })
})

// Error handling middleware (should be last)
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  logger.info(`LinkRadio Parsing Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

module.exports = app