const Joi = require('joi')
const ParserManager = require('../parsers/ParserManager')
const logger = require('../config/logger')

const parsingRequestSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL이 올바른 형식이 아닙니다',
    'any.required': 'URL은 필수 입력값입니다'
  }),
  options: Joi.object({
    strategy: Joi.string().valid('readability').optional(),
    timeout: Joi.number().min(1000).max(60000).optional(),
    waitUntil: Joi.string().valid('load', 'domcontentloaded', 'networkidle0', 'networkidle2').optional(),
    waitForSelector: Joi.string().optional(),
    delay: Joi.number().min(0).max(10000).optional(),
    loadMedia: Joi.boolean().optional(),
    userAgent: Joi.string().optional()
  }).optional()
})

class ParseController {
  constructor() {
    this.parserManager = new ParserManager()
  }

  async initialize() {
    const ReadabilityStrategy = require('../parsers/strategies/ReadabilityStrategy')

    const readabilityStrategy = new ReadabilityStrategy()
    this.parserManager.registerStrategy(readabilityStrategy, true)

    logger.info('ParseController initialized successfully')
  }

  async parseContent(req, res, next) {
    const startTime = Date.now()

    try {
      const { error, value } = parsingRequestSchema.validate(req.body)

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
          timestamp: new Date().toISOString()
        })
      }

      const { url, options = {} } = value

      logger.info(`Parsing request received for URL: ${url}`)

      const parsedContent = await this.parserManager.parseContent(url, '', options)
      const result = { success: true, data: parsedContent }

      if (!result.success) {
        return res.status(422).json({
          success: false,
          error: 'Parsing Failed',
          message: result.error || '콘텐츠 추출에 실패했습니다',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        })
      }

      logger.info(`Parsing completed successfully for URL: ${url}`)

      res.status(200).json({
        success: true,
        data: {
          content: result.data,
          metadata: {
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        }
      })

    } catch (error) {
      logger.error('Parsing controller error:', error)
      next(error)
    }
  }

  async parseContentBatch(req, res, next) {
    const startTime = Date.now()

    try {
      const batchSchema = Joi.object({
        urls: Joi.array().items(
          Joi.object({
            url: Joi.string().uri().required(),
            options: Joi.object({
              strategy: Joi.string().valid('readability').optional(),
              timeout: Joi.number().min(1000).max(60000).optional(),
              waitUntil: Joi.string().valid('load', 'domcontentloaded', 'networkidle0', 'networkidle2').optional()
            }).optional()
          })
        ).min(1).max(10).required()
      })

      const { error, value } = batchSchema.validate(req.body)

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
          timestamp: new Date().toISOString()
        })
      }

      const { urls } = value

      logger.info(`Batch parsing request received for ${urls.length} URLs`)

      const results = await Promise.allSettled(
        urls.map(async (item, index) => {
          try {
            const parsedContent = await this.parserManager.parseContent(item.url, '', item.options || {})
            return {
              index,
              url: item.url,
              success: true,
              data: parsedContent,
              error: null
            }
          } catch (error) {
            return {
              index,
              url: item.url,
              success: false,
              data: null,
              error: error.message
            }
          }
        })
      )

      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            index,
            url: urls[index].url,
            success: false,
            data: null,
            error: result.reason?.message || 'Unknown error'
          }
        }
      })

      const successCount = processedResults.filter(r => r.success).length

      logger.info(`Batch parsing completed: ${successCount}/${urls.length} successful`)

      res.status(200).json({
        success: true,
        data: {
          results: processedResults,
          summary: {
            total: urls.length,
            successful: successCount,
            failed: urls.length - successCount
          },
          metadata: {
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        }
      })

    } catch (error) {
      logger.error('Batch parsing controller error:', error)
      next(error)
    }
  }

  async getParsingStrategies(req, res, next) {
    try {
      const strategies = this.parserManager.getRegisteredStrategies()

      res.status(200).json({
        success: true,
        data: {
          strategies: strategies.map(strategyName => ({
            name: strategyName,
            supports: 'Web pages with JavaScript support',
            confidence: 'Varies by content type'
          }))
        }
      })
    } catch (error) {
      logger.error('Get strategies controller error:', error)
      next(error)
    }
  }

  async healthCheck(req, res, next) {
    try {
      const strategies = this.parserManager.getRegisteredStrategies()
      const isHealthy = strategies.length > 0

      const status = isHealthy ? 200 : 503

      res.status(status).json({
        success: isHealthy,
        service: 'LinkRadio Parsing Server',
        parsers: isHealthy ? 'Available' : 'Unavailable',
        strategies: strategies,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Parser health check error:', error)
      next(error)
    }
  }
}

module.exports = ParseController