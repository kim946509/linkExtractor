/**
 * 추출된 콘텐츠 데이터 모델
 */
class ExtractedContent {
  constructor({
    title = '',
    content = '',
    author = '',
    publishDate = null,
    url = '',
    description = '',
    language = 'ko',
    tags = [],
    readingTime = 0,
    wordCount = 0,
    images = [],
    metadata = {}
  } = {}) {
    this.title = title
    this.content = content
    this.author = author
    this.publishDate = publishDate
    this.url = url
    this.description = description
    this.language = language
    this.tags = tags
    this.readingTime = readingTime
    this.wordCount = wordCount
    this.images = images
    this.metadata = metadata
    this.extractedAt = new Date()
  }

  /**
   * 콘텐츠의 유효성을 검증
   * @returns {boolean} 유효성 여부
   */
  isValid() {
    return this.title && this.content &&
           this.title.trim().length > 0 &&
           this.content.trim().length > 0
  }

  /**
   * 콘텐츠를 JSON으로 직렬화
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      title: this.title,
      content: this.content,
      author: this.author,
      publishDate: this.publishDate,
      url: this.url,
      description: this.description,
      language: this.language,
      tags: this.tags,
      readingTime: this.readingTime,
      wordCount: this.wordCount,
      images: this.images,
      metadata: this.metadata,
      extractedAt: this.extractedAt
    }
  }

  /**
   * JSON에서 ExtractedContent 인스턴스를 생성
   * @param {Object} json - JSON 객체
   * @returns {ExtractedContent} 인스턴스
   */
  static fromJSON(json) {
    return new ExtractedContent(json)
  }

  /**
   * 콘텐츠 품질 점수를 계산 (0-100)
   * @returns {number} 품질 점수
   */
  getQualityScore() {
    let score = 0

    // 제목 품질 (30점)
    if (this.title && this.title.trim().length > 10) {
      score += 30
    } else if (this.title && this.title.trim().length > 0) {
      score += 15
    }

    // 콘텐츠 길이 (40점)
    const contentLength = this.content ? this.content.trim().length : 0
    if (contentLength > 1000) {
      score += 40
    } else if (contentLength > 500) {
      score += 30
    } else if (contentLength > 100) {
      score += 20
    } else if (contentLength > 0) {
      score += 10
    }

    // 메타데이터 완성도 (30점)
    if (this.author) score += 10
    if (this.publishDate) score += 10
    if (this.description) score += 5
    if (this.tags && this.tags.length > 0) score += 5

    return Math.min(score, 100)
  }

  /**
   * 예상 읽기 시간을 계산 (분 단위)
   * @param {number} wordsPerMinute - 분당 읽기 단어 수 (기본: 200)
   * @returns {number} 예상 읽기 시간 (분)
   */
  calculateReadingTime(wordsPerMinute = 200) {
    if (!this.content) return 0

    const wordCount = this.content.split(/\s+/).length
    this.wordCount = wordCount
    this.readingTime = Math.ceil(wordCount / wordsPerMinute)

    return this.readingTime
  }
}

module.exports = ExtractedContent