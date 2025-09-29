const express = require('express')
const ParseController = require('../controllers/parseController')
const logger = require('../config/logger')

const router = express.Router()
const parseController = new ParseController()

router.post('/parse', async (req, res, next) => {
  try {
    await parseController.parseContent(req, res, next)
  } catch (error) {
    logger.error('Parse route error:', error)
    next(error)
  }
})

router.post('/parse/batch', async (req, res, next) => {
  try {
    await parseController.parseContentBatch(req, res, next)
  } catch (error) {
    logger.error('Batch parse route error:', error)
    next(error)
  }
})

router.get('/strategies', async (req, res, next) => {
  try {
    await parseController.getParsingStrategies(req, res, next)
  } catch (error) {
    logger.error('Strategies route error:', error)
    next(error)
  }
})

router.get('/health', async (req, res, next) => {
  try {
    await parseController.healthCheck(req, res, next)
  } catch (error) {
    logger.error('Parser health route error:', error)
    next(error)
  }
})

async function initializeRoutes() {
  try {
    await parseController.initialize()
    logger.info('Parse controller initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize parse controller:', error)
    throw error
  }
}

module.exports = { router, initializeRoutes }