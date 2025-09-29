const logger = require('../config/logger')

/**
 * 파서 관리자 클래스
 * Strategy 패턴을 구현하여 다양한 파싱 전략을 관리
 */
class ParserManager {
  constructor() {
    this.extractors = new Map()
    this.strategies = new Map()
    this.defaultStrategy = null
  }

  /**
   * 콘텐츠 추출기를 등록
   * @param {ContentExtractor} extractor - 등록할 추출기
   */
  registerExtractor(extractor) {
    if (!extractor.getName) {
      throw new Error('Extractor must implement getName() method')
    }

    const name = extractor.getName()
    this.extractors.set(name, extractor)
    logger.info(`Content extractor registered: ${name}`)
  }

  /**
   * 파싱 전략을 등록
   * @param {ParsingStrategy} strategy - 등록할 전략
   * @param {boolean} isDefault - 기본 전략 여부
   */
  registerStrategy(strategy, isDefault = false) {
    if (!strategy.getStrategyName) {
      throw new Error('Strategy must implement getStrategyName() method')
    }

    const name = strategy.getStrategyName()
    this.strategies.set(name, strategy)

    if (isDefault || this.strategies.size === 1) {
      this.defaultStrategy = strategy
    }

    logger.info(`Parsing strategy registered: ${name}${isDefault ? ' (default)' : ''}`)
  }

  /**
   * URL에 가장 적합한 추출기를 찾습니다
   * @param {string} url - 대상 URL
   * @returns {ContentExtractor|null} 적합한 추출기
   */
  findBestExtractor(url) {
    let bestExtractor = null
    let highestPriority = Infinity

    for (const extractor of this.extractors.values()) {
      if (extractor.canHandle(url)) {
        const priority = extractor.getPriority()
        if (priority < highestPriority) {
          highestPriority = priority
          bestExtractor = extractor
        }
      }
    }

    return bestExtractor
  }

  /**
   * URL과 콘텐츠 타입에 가장 적합한 파싱 전략을 찾습니다
   * @param {string} url - 대상 URL
   * @param {string} contentType - 콘텐츠 타입
   * @returns {ParsingStrategy|null} 적합한 전략
   */
  findBestStrategy(url, contentType = '') {
    let bestStrategy = null
    let highestConfidence = 0

    for (const strategy of this.strategies.values()) {
      if (strategy.supports(url, contentType)) {
        const confidence = strategy.getConfidenceScore(url)
        if (confidence > highestConfidence) {
          highestConfidence = confidence
          bestStrategy = strategy
        }
      }
    }

    return bestStrategy || this.defaultStrategy
  }

  /**
   * URL에서 콘텐츠를 추출합니다
   * @param {string} url - 추출할 URL
   * @param {Object} options - 추출 옵션
   * @returns {Promise<ExtractedContent>} 추출된 콘텐츠
   */
  async extractContent(url, options = {}) {
    const startTime = Date.now()

    try {
      logger.info(`Starting content extraction for URL: ${url}`)

      // 적합한 추출기 찾기
      const extractor = this.findBestExtractor(url)
      if (!extractor) {
        throw new Error(`No suitable extractor found for URL: ${url}`)
      }

      logger.debug(`Using extractor: ${extractor.getName()}`)

      // 콘텐츠 추출
      const content = await extractor.extract(url, options)

      // 결과 검증
      if (!extractor.validateContent(content)) {
        throw new Error('Extracted content validation failed')
      }

      const extractionTime = Date.now() - startTime
      logger.info(`Content extraction completed in ${extractionTime}ms for URL: ${url}`)

      return content
    } catch (error) {
      const extractionTime = Date.now() - startTime
      logger.error(`Content extraction failed after ${extractionTime}ms for URL: ${url}`, {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * 파싱 전략을 사용하여 콘텐츠를 파싱합니다
   * @param {string} url - 파싱할 URL
   * @param {string} contentType - 콘텐츠 타입
   * @param {Object} options - 파싱 옵션
   * @returns {Promise<ParsedContent>} 파싱된 콘텐츠
   */
  async parseContent(url, contentType = '', options = {}) {
    const startTime = Date.now()

    try {
      logger.info(`Starting content parsing for URL: ${url}`)

      // 적합한 전략 찾기
      const strategy = this.findBestStrategy(url, contentType)
      if (!strategy) {
        throw new Error(`No suitable parsing strategy found for URL: ${url}`)
      }

      logger.debug(`Using parsing strategy: ${strategy.getStrategyName()}`)

      // 전략 준비
      await strategy.prepare(options)

      // 콘텐츠 파싱
      const parsedContent = await strategy.parse(url, options)
      parsedContent.parsingTime = Date.now() - startTime

      // 정리 작업
      await strategy.cleanup()

      logger.info(`Content parsing completed in ${parsedContent.parsingTime}ms for URL: ${url}`)

      return parsedContent
    } catch (error) {
      const parsingTime = Date.now() - startTime
      logger.error(`Content parsing failed after ${parsingTime}ms for URL: ${url}`, {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * 등록된 모든 추출기 목록을 반환
   * @returns {Array<string>} 추출기 이름 목록
   */
  getRegisteredExtractors() {
    return Array.from(this.extractors.keys())
  }

  /**
   * 등록된 모든 전략 목록을 반환
   * @returns {Array<string>} 전략 이름 목록
   */
  getRegisteredStrategies() {
    return Array.from(this.strategies.keys())
  }

  /**
   * 기본 전략을 설정
   * @param {string} strategyName - 전략 이름
   */
  setDefaultStrategy(strategyName) {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyName}`)
    }

    this.defaultStrategy = strategy
    logger.info(`Default parsing strategy set to: ${strategyName}`)
  }
}

// 싱글톤 인스턴스
const parserManager = new ParserManager()

module.exports = parserManager