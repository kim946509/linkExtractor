const ParsingStrategy = require('../interfaces/ParsingStrategy')
const ParsedContent = require('../models/ParsedContent')
const logger = require('../../config/logger')

/**
 * Readability.js 기반 파싱 전략
 * Mozilla의 Readability 라이브러리를 사용한 콘텐츠 추출
 */
class ReadabilityStrategy extends ParsingStrategy {
  constructor() {
    super()
    this.name = 'readability'
  }

  /**
   * @override
   */
  getStrategyName() {
    return this.name
  }

  /**
   * @override
   */
  supports(url, contentType) {
    // 대부분의 웹페이지를 지원
    return url.startsWith('http://') || url.startsWith('https://')
  }

  /**
   * @override
   */
  getConfidenceScore(url) {
    // LinkedIn, Medium 등 주요 플랫폼에 대해 높은 신뢰도
    if (url.includes('linkedin.com') ||
        url.includes('medium.com') ||
        url.includes('dev.to') ||
        url.includes('hackernoon.com')) {
      return 90
    }

    // 블로그 및 뉴스 사이트
    if (url.includes('blog') ||
        url.includes('news') ||
        url.includes('article')) {
      return 80
    }

    // 일반적인 웹페이지
    return 70
  }

  /**
   * @override
   */
  async prepare(options = {}) {
    // Readability 라이브러리 동적 로딩
    try {
      this.Readability = require('@mozilla/readability')
      this.jsdom = require('jsdom')
      logger.debug('Readability strategy prepared')
    } catch (error) {
      logger.error('Failed to load Readability dependencies', error)
      throw new Error('Readability dependencies not available')
    }
  }

  /**
   * @override
   */
  async parse(url, options = {}) {
    const startTime = Date.now()

    try {
      logger.debug(`Starting Readability parsing for: ${url}`)

      // HTML 콘텐츠 가져오기 (실제로는 Puppeteer 등으로 구현)
      const htmlContent = await this.fetchHtmlContent(url, options)

      // JSDOM으로 DOM 생성
      const { JSDOM } = this.jsdom
      const dom = new JSDOM(htmlContent, { url })
      const document = dom.window.document

      // Readability로 콘텐츠 추출
      const reader = new this.Readability.Readability(document)
      const article = reader.parse()

      if (!article) {
        throw new Error('Failed to extract content using Readability')
      }

      // ParsedContent 객체 생성
      const parsedContent = new ParsedContent({
        title: article.title || '',
        content: article.textContent || '',
        htmlContent: article.content || '',
        author: this.extractAuthor(document),
        publishDate: this.extractPublishDate(document),
        url: url,
        description: this.extractDescription(document),
        excerpt: article.excerpt || '',
        language: this.extractLanguage(document),
        tags: this.extractTags(document),
        images: this.extractImages(article.content),
        links: this.extractLinks(article.content),
        metadata: {
          readingTimeMinutes: article.length ? Math.ceil(article.length / 200) : 0,
          characterCount: article.textContent ? article.textContent.length : 0
        },
        parsingStrategy: this.getStrategyName(),
        parsingTime: Date.now() - startTime
      })

      // 신뢰도 계산
      parsedContent.calculateConfidence()

      // 콘텐츠 정리
      parsedContent.clean()

      logger.debug(`Readability parsing completed for: ${url}`)
      return parsedContent

    } catch (error) {
      logger.error(`Readability parsing failed for: ${url}`, error)
      throw error
    }
  }

  /**
   * HTML 콘텐츠를 가져옵니다 (실제로는 Puppeteer 등으로 구현)
   * @param {string} url - 대상 URL
   * @param {Object} options - 옵션
   * @returns {Promise<string>} HTML 콘텐츠
   */
  async fetchHtmlContent(url, options) {
    // TODO: 실제로는 Puppeteer나 다른 방법으로 구현
    // 지금은 기본적인 fetch로 구현
    const axios = require('axios')

    const response = await axios.get(url, {
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': 'LinkRadio Content Parser 1.0'
      }
    })

    return response.data
  }

  /**
   * 문서에서 작성자 정보를 추출
   * @param {Document} document - DOM 문서
   * @returns {string} 작성자
   */
  extractAuthor(document) {
    const selectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline',
      '[rel="author"]'
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element) {
        return element.getAttribute('content') || element.textContent?.trim() || ''
      }
    }

    return ''
  }

  /**
   * 문서에서 발행일을 추출
   * @param {Document} document - DOM 문서
   * @returns {Date|null} 발행일
   */
  extractPublishDate(document) {
    const selectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish_date"]',
      'meta[name="date"]',
      'time[datetime]',
      '.published',
      '.date'
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element) {
        const dateString = element.getAttribute('content') ||
                          element.getAttribute('datetime') ||
                          element.textContent?.trim()

        if (dateString) {
          const date = new Date(dateString)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
    }

    return null
  }

  /**
   * 문서에서 설명을 추출
   * @param {Document} document - DOM 문서
   * @returns {string} 설명
   */
  extractDescription(document) {
    const selectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]'
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element) {
        return element.getAttribute('content') || ''
      }
    }

    return ''
  }

  /**
   * 문서의 언어를 추출
   * @param {Document} document - DOM 문서
   * @returns {string} 언어 코드
   */
  extractLanguage(document) {
    return document.documentElement.lang ||
           document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
           'ko'
  }

  /**
   * 문서에서 태그를 추출
   * @param {Document} document - DOM 문서
   * @returns {Array<string>} 태그 목록
   */
  extractTags(document) {
    const tags = []

    // Keywords meta tag
    const keywords = document.querySelector('meta[name="keywords"]')
    if (keywords) {
      tags.push(...keywords.getAttribute('content').split(',').map(tag => tag.trim()))
    }

    // Article tags
    const articleTags = document.querySelectorAll('.tag, .tags a, .category')
    articleTags.forEach(tag => {
      const text = tag.textContent?.trim()
      if (text) tags.push(text)
    })

    return [...new Set(tags)].filter(tag => tag.length > 0)
  }

  /**
   * HTML 콘텐츠에서 이미지를 추출
   * @param {string} htmlContent - HTML 콘텐츠
   * @returns {Array<Object>} 이미지 목록
   */
  extractImages(htmlContent) {
    if (!htmlContent) return []

    const { JSDOM } = this.jsdom
    const dom = new JSDOM(htmlContent)
    const images = dom.window.document.querySelectorAll('img')

    return Array.from(images).map(img => ({
      src: img.src,
      alt: img.alt || '',
      title: img.title || ''
    }))
  }

  /**
   * HTML 콘텐츠에서 링크를 추출
   * @param {string} htmlContent - HTML 콘텐츠
   * @returns {Array<string>} 링크 목록
   */
  extractLinks(htmlContent) {
    if (!htmlContent) return []

    const { JSDOM } = this.jsdom
    const dom = new JSDOM(htmlContent)
    const links = dom.window.document.querySelectorAll('a[href]')

    return Array.from(links)
      .map(link => link.href)
      .filter(href => href.startsWith('http'))
  }

  /**
   * @override
   */
  async cleanup() {
    // 필요한 경우 리소스 정리
    logger.debug('Readability strategy cleanup completed')
  }
}

module.exports = ReadabilityStrategy