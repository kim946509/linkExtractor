const parserManager = require('./ParserManager')
const logger = require('../config/logger')

/**
 * 파서 팩토리 클래스
 * 파싱 전략과 콘텐츠 추출기를 등록하고 초기화
 */
class ParserFactory {
  constructor() {
    this.initialized = false
  }

  /**
   * 모든 파서와 전략을 초기화합니다
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('ParserFactory already initialized')
      return
    }

    try {
      logger.info('Initializing ParserFactory...')

      // 파싱 전략 등록
      await this.registerStrategies()

      // 콘텐츠 추출기 등록
      await this.registerExtractors()

      this.initialized = true
      logger.info('ParserFactory initialization completed')

      // 등록된 컴포넌트 로깅
      this.logRegisteredComponents()

    } catch (error) {
      logger.error('Failed to initialize ParserFactory', error)
      throw error
    }
  }

  /**
   * 파싱 전략들을 등록합니다
   */
  async registerStrategies() {
    logger.debug('Registering parsing strategies...')

    try {
      // Readability 전략 등록
      const ReadabilityStrategy = require('./strategies/ReadabilityStrategy')
      const readabilityStrategy = new ReadabilityStrategy()
      parserManager.registerStrategy(readabilityStrategy, true) // 기본 전략으로 설정

      // 향후 추가될 전략들
      // const PuppeteerStrategy = require('./strategies/PuppeteerStrategy')
      // const puppeteerStrategy = new PuppeteerStrategy()
      // parserManager.registerStrategy(puppeteerStrategy)

      logger.debug('Parsing strategies registration completed')

    } catch (error) {
      logger.error('Failed to register parsing strategies', error)
      throw error
    }
  }

  /**
   * 콘텐츠 추출기들을 등록합니다
   */
  async registerExtractors() {
    logger.debug('Registering content extractors...')

    try {
      // 기본 추출기 등록
      const BaseContentExtractor = require('./extractors/BaseContentExtractor')
      const baseExtractor = new BaseContentExtractor({
        priority: 100,
        defaultStrategy: 'readability'
      })
      parserManager.registerExtractor(baseExtractor)

      // LinkedIn 전용 추출기 (향후 구현)
      // const LinkedInExtractor = require('./extractors/LinkedInExtractor')
      // const linkedinExtractor = new LinkedInExtractor({
      //   priority: 10,
      //   supportedDomains: ['linkedin.com']
      // })
      // parserManager.registerExtractor(linkedinExtractor)

      // Medium 전용 추출기 (향후 구현)
      // const MediumExtractor = require('./extractors/MediumExtractor')
      // const mediumExtractor = new MediumExtractor({
      //   priority: 20,
      //   supportedDomains: ['medium.com']
      // })
      // parserManager.registerExtractor(mediumExtractor)

      logger.debug('Content extractors registration completed')

    } catch (error) {
      logger.error('Failed to register content extractors', error)
      throw error
    }
  }

  /**
   * 특정 도메인에 특화된 추출기를 생성합니다
   * @param {string} domain - 도메인명
   * @param {Object} options - 추출기 옵션
   * @returns {ContentExtractor} 생성된 추출기
   */
  createDomainSpecificExtractor(domain, options = {}) {
    const BaseContentExtractor = require('./extractors/BaseContentExtractor')

    const extractor = new BaseContentExtractor({
      ...options,
      supportedDomains: [domain],
      priority: options.priority || 50
    })

    extractor.name = `${domain}-extractor`

    return extractor
  }

  /**
   * 사용자 정의 파싱 전략을 생성합니다
   * @param {string} name - 전략명
   * @param {Object} config - 설정
   * @returns {ParsingStrategy} 생성된 전략
   */
  createCustomStrategy(name, config = {}) {
    const ParsingStrategy = require('./interfaces/ParsingStrategy')

    class CustomStrategy extends ParsingStrategy {
      getStrategyName() {
        return name
      }

      supports(url, contentType) {
        return config.supportedUrls ?
          config.supportedUrls.some(pattern => url.includes(pattern)) :
          true
      }

      getConfidenceScore(url) {
        return config.confidenceScore || 50
      }

      async parse(url, options) {
        // 사용자 정의 파싱 로직
        if (config.parseFunction) {
          return await config.parseFunction(url, options)
        }

        throw new Error('Custom strategy parse function not implemented')
      }
    }

    return new CustomStrategy()
  }

  /**
   * 등록된 컴포넌트들을 로깅합니다
   */
  logRegisteredComponents() {
    const strategies = parserManager.getRegisteredStrategies()
    const extractors = parserManager.getRegisteredExtractors()

    logger.info('Registered parsing strategies:', strategies)
    logger.info('Registered content extractors:', extractors)
  }

  /**
   * 파서 매니저 상태를 반환합니다
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      initialized: this.initialized,
      strategies: parserManager.getRegisteredStrategies(),
      extractors: parserManager.getRegisteredExtractors()
    }
  }

  /**
   * 팩토리를 재설정합니다
   */
  reset() {
    this.initialized = false
    // 파서 매니저 재설정이 필요한 경우 여기에 구현
    logger.info('ParserFactory reset completed')
  }

  /**
   * 런타임에 새로운 전략을 추가합니다
   * @param {ParsingStrategy} strategy - 추가할 전략
   * @param {boolean} isDefault - 기본 전략 여부
   */
  addStrategy(strategy, isDefault = false) {
    if (!this.initialized) {
      throw new Error('ParserFactory not initialized')
    }

    parserManager.registerStrategy(strategy, isDefault)
    logger.info(`Runtime strategy added: ${strategy.getStrategyName()}`)
  }

  /**
   * 런타임에 새로운 추출기를 추가합니다
   * @param {ContentExtractor} extractor - 추가할 추출기
   */
  addExtractor(extractor) {
    if (!this.initialized) {
      throw new Error('ParserFactory not initialized')
    }

    parserManager.registerExtractor(extractor)
    logger.info(`Runtime extractor added: ${extractor.getName()}`)
  }
}

// 싱글톤 인스턴스
const parserFactory = new ParserFactory()

module.exports = parserFactory