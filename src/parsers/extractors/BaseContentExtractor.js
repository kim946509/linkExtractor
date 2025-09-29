const ContentExtractor = require('../interfaces/ContentExtractor')
const ExtractedContent = require('../models/ExtractedContent')
const parserManager = require('../ParserManager')
const logger = require('../../config/logger')

/**
 * 기본 콘텐츠 추출기
 * 파싱 전략을 사용하여 콘텐츠를 추출하는 범용 추출기
 */
class BaseContentExtractor extends ContentExtractor {
  constructor(options = {}) {
    super()
    this.name = 'base'
    this.priority = options.priority || 100
    this.supportedDomains = options.supportedDomains || []
    this.defaultStrategy = options.defaultStrategy || 'readability'
  }

  /**
   * @override
   */
  getName() {
    return this.name
  }

  /**
   * @override
   */
  getPriority() {
    return this.priority
  }

  /**
   * @override
   */
  canHandle(url) {
    // HTTP/HTTPS URL만 처리
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false
    }

    // 지원 도메인이 설정된 경우 확인
    if (this.supportedDomains.length > 0) {
      return this.supportedDomains.some(domain => url.includes(domain))
    }

    // 기본적으로 모든 웹 URL 지원
    return true
  }

  /**
   * @override
   */
  async extract(url, options = {}) {
    const startTime = Date.now()

    try {
      logger.info(`Starting content extraction with BaseContentExtractor for: ${url}`)

      // URL 유효성 검사
      if (!this.canHandle(url)) {
        throw new Error(`URL not supported by ${this.getName()}: ${url}`)
      }

      // 콘텐츠 타입 감지 (선택적)
      const contentType = await this.detectContentType(url, options)

      // 파싱 전략 사용하여 콘텐츠 파싱
      const parsedContent = await parserManager.parseContent(url, contentType, {
        ...options,
        extractor: this.getName()
      })

      // ParsedContent를 ExtractedContent로 변환
      const extractedContent = parsedContent.toExtractedContent()

      // 읽기 시간 계산
      extractedContent.calculateReadingTime()

      // 추가 후처리
      await this.postProcess(extractedContent, options)

      const extractionTime = Date.now() - startTime
      logger.info(`Content extraction completed in ${extractionTime}ms for: ${url}`)

      return extractedContent

    } catch (error) {
      const extractionTime = Date.now() - startTime
      logger.error(`Content extraction failed after ${extractionTime}ms for: ${url}`, {
        error: error.message,
        extractor: this.getName()
      })
      throw error
    }
  }

  /**
   * 콘텐츠 타입을 감지합니다
   * @param {string} url - 대상 URL
   * @param {Object} options - 옵션
   * @returns {Promise<string>} 콘텐츠 타입
   */
  async detectContentType(url, options = {}) {
    try {
      // 간단한 HEAD 요청으로 콘텐츠 타입 확인
      const axios = require('axios')
      const response = await axios.head(url, {
        timeout: options.timeout || 10000,
        headers: {
          'User-Agent': 'LinkRadio Content Parser 1.0'
        }
      })

      return response.headers['content-type'] || 'text/html'
    } catch (error) {
      logger.debug(`Failed to detect content type for ${url}, assuming text/html`)
      return 'text/html'
    }
  }

  /**
   * 추출된 콘텐츠의 후처리를 수행합니다
   * @param {ExtractedContent} content - 추출된 콘텐츠
   * @param {Object} options - 옵션
   */
  async postProcess(content, options = {}) {
    // 콘텐츠 품질 향상
    await this.enhanceContent(content, options)

    // 메타데이터 보강
    await this.enrichMetadata(content, options)

    // 콘텐츠 정리
    this.cleanContent(content)
  }

  /**
   * 콘텐츠 품질을 향상시킵니다
   * @param {ExtractedContent} content - 콘텐츠
   * @param {Object} options - 옵션
   */
  async enhanceContent(content, options = {}) {
    // 제목 개선
    if (content.title) {
      content.title = this.cleanTitle(content.title)
    }

    // 콘텐츠 정리
    if (content.content) {
      content.content = this.cleanTextContent(content.content)
    }

    // 설명 생성 (없는 경우)
    if (!content.description && content.content) {
      content.description = this.generateDescription(content.content)
    }
  }

  /**
   * 메타데이터를 보강합니다
   * @param {ExtractedContent} content - 콘텐츠
   * @param {Object} options - 옵션
   */
  async enrichMetadata(content, options = {}) {
    // 품질 점수 계산
    const qualityScore = content.getQualityScore()
    content.metadata.qualityScore = qualityScore

    // 추출기 정보 추가
    content.metadata.extractor = this.getName()
    content.metadata.extractorPriority = this.getPriority()

    // 언어 감지 (간단한 휴리스틱)
    if (!content.language) {
      content.language = this.detectLanguage(content.content)
    }
  }

  /**
   * 콘텐츠를 정리합니다
   * @param {ExtractedContent} content - 콘텐츠
   */
  cleanContent(content) {
    // 불필요한 공백 제거
    if (content.title) {
      content.title = content.title.trim()
    }

    if (content.content) {
      content.content = content.content.replace(/\s+/g, ' ').trim()
    }

    if (content.description) {
      content.description = content.description.trim()
    }

    // 빈 태그 제거
    content.tags = content.tags.filter(tag => tag && tag.trim().length > 0)
  }

  /**
   * 제목을 정리합니다
   * @param {string} title - 원본 제목
   * @returns {string} 정리된 제목
   */
  cleanTitle(title) {
    return title
      .replace(/\s+/g, ' ')
      .replace(/[|•·]\s*.*$/, '') // 사이트명 제거
      .trim()
  }

  /**
   * 텍스트 콘텐츠를 정리합니다
   * @param {string} content - 원본 콘텐츠
   * @returns {string} 정리된 콘텐츠
   */
  cleanTextContent(content) {
    return content
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .replace(/\n\s*\n/g, '\n\n') // 연속된 빈 줄을 두 개로
      .trim()
  }

  /**
   * 콘텐츠에서 설명을 생성합니다
   * @param {string} content - 콘텐츠
   * @param {number} maxLength - 최대 길이
   * @returns {string} 생성된 설명
   */
  generateDescription(content, maxLength = 200) {
    if (!content) return ''

    const sentences = content.split(/[.!?]+/)
    let description = ''

    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length === 0) continue

      if (description.length + trimmed.length <= maxLength) {
        description += (description ? '. ' : '') + trimmed
      } else {
        break
      }
    }

    return description + (description.endsWith('.') ? '' : '.')
  }

  /**
   * 간단한 언어 감지
   * @param {string} content - 콘텐츠
   * @returns {string} 언어 코드
   */
  detectLanguage(content) {
    if (!content) return 'ko'

    // 한글 문자 비율 계산
    const koreanChars = content.match(/[가-힣]/g) || []
    const totalChars = content.replace(/\s/g, '').length

    if (totalChars === 0) return 'ko'

    const koreanRatio = koreanChars.length / totalChars

    if (koreanRatio > 0.3) return 'ko'
    if (koreanRatio > 0.1) return 'ko' // 한영 혼합일 가능성

    return 'en' // 기본값
  }
}

module.exports = BaseContentExtractor