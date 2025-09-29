/**
 * 파싱된 콘텐츠 데이터 모델
 * 파싱 과정에서 생성되는 중간 데이터를 담는 모델
 */
class ParsedContent {
  constructor({
    title = '',
    content = '',
    htmlContent = '',
    author = '',
    publishDate = null,
    url = '',
    description = '',
    excerpt = '',
    language = '',
    tags = [],
    images = [],
    links = [],
    metadata = {},
    parsingStrategy = '',
    parsingTime = 0,
    confidence = 0
  } = {}) {
    this.title = title
    this.content = content
    this.htmlContent = htmlContent
    this.author = author
    this.publishDate = publishDate
    this.url = url
    this.description = description
    this.excerpt = excerpt
    this.language = language
    this.tags = tags
    this.images = images
    this.links = links
    this.metadata = metadata
    this.parsingStrategy = parsingStrategy
    this.parsingTime = parsingTime
    this.confidence = confidence
    this.parsedAt = new Date()
  }

  /**
   * ExtractedContent로 변환
   * @returns {ExtractedContent} 변환된 콘텐츠
   */
  toExtractedContent() {
    const ExtractedContent = require('./ExtractedContent')

    return new ExtractedContent({
      title: this.title,
      content: this.content,
      author: this.author,
      publishDate: this.publishDate,
      url: this.url,
      description: this.description,
      language: this.language,
      tags: this.tags,
      images: this.images,
      metadata: {
        ...this.metadata,
        parsingStrategy: this.parsingStrategy,
        parsingTime: this.parsingTime,
        confidence: this.confidence,
        parsedAt: this.parsedAt
      }
    })
  }

  /**
   * 파싱 결과의 신뢰도를 계산
   * @returns {number} 신뢰도 (0-100)
   */
  calculateConfidence() {
    let confidence = 0

    // 기본 콘텐츠 존재 여부 (50점)
    if (this.title && this.content) {
      confidence += 50
    } else if (this.title || this.content) {
      confidence += 25
    }

    // 콘텐츠 품질 (30점)
    const titleLength = this.title ? this.title.trim().length : 0
    const contentLength = this.content ? this.content.trim().length : 0

    if (titleLength > 10 && contentLength > 500) {
      confidence += 30
    } else if (titleLength > 0 && contentLength > 100) {
      confidence += 20
    } else if (titleLength > 0 || contentLength > 0) {
      confidence += 10
    }

    // 메타데이터 완성도 (20점)
    if (this.author) confidence += 5
    if (this.publishDate) confidence += 5
    if (this.description) confidence += 5
    if (this.language) confidence += 5

    this.confidence = Math.min(confidence, 100)
    return this.confidence
  }

  /**
   * 파싱 결과가 유효한지 확인
   * @returns {boolean} 유효성 여부
   */
  isValid() {
    return this.title && this.content &&
           this.title.trim().length > 0 &&
           this.content.trim().length > 0 &&
           this.confidence > 30 // 최소 신뢰도 30% 이상
  }

  /**
   * 콘텐츠를 정리하고 최적화
   */
  clean() {
    // 제목 정리
    this.title = this.title ? this.title.trim() : ''

    // 콘텐츠 정리 (불필요한 공백 제거)
    this.content = this.content
      ? this.content.replace(/\s+/g, ' ').trim()
      : ''

    // 설명 정리
    this.description = this.description ? this.description.trim() : ''

    // 작성자 정리
    this.author = this.author ? this.author.trim() : ''

    // 태그 정리
    this.tags = this.tags
      ? this.tags.filter(tag => tag && tag.trim().length > 0)
      : []

    // 중복 링크 제거
    this.links = this.links
      ? [...new Set(this.links)]
      : []
  }

  /**
   * JSON 직렬화
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      title: this.title,
      content: this.content,
      htmlContent: this.htmlContent,
      author: this.author,
      publishDate: this.publishDate,
      url: this.url,
      description: this.description,
      excerpt: this.excerpt,
      language: this.language,
      tags: this.tags,
      images: this.images,
      links: this.links,
      metadata: this.metadata,
      parsingStrategy: this.parsingStrategy,
      parsingTime: this.parsingTime,
      confidence: this.confidence,
      parsedAt: this.parsedAt
    }
  }
}

module.exports = ParsedContent