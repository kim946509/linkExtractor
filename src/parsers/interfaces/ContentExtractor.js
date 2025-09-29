/**
 * 콘텐츠 추출 인터페이스
 * 모든 콘텐츠 추출기가 구현해야 하는 기본 인터페이스
 */
class ContentExtractor {
  /**
   * URL에서 콘텐츠를 추출합니다
   * @param {string} url - 추출할 URL
   * @param {Object} options - 추출 옵션
   * @returns {Promise<ExtractedContent>} 추출된 콘텐츠
   */
  async extract(url, options = {}) {
    throw new Error('extract method must be implemented')
  }

  /**
   * 추출기가 해당 URL을 처리할 수 있는지 확인
   * @param {string} url - 확인할 URL
   * @returns {boolean} 처리 가능 여부
   */
  canHandle(url) {
    throw new Error('canHandle method must be implemented')
  }

  /**
   * 추출기의 이름을 반환
   * @returns {string} 추출기 이름
   */
  getName() {
    throw new Error('getName method must be implemented')
  }

  /**
   * 추출기의 우선순위를 반환 (낮을수록 우선)
   * @returns {number} 우선순위
   */
  getPriority() {
    return 100 // 기본 우선순위
  }

  /**
   * 추출 결과를 검증
   * @param {ExtractedContent} content - 검증할 콘텐츠
   * @returns {boolean} 검증 결과
   */
  validateContent(content) {
    return content &&
           content.title &&
           content.content &&
           content.title.trim().length > 0 &&
           content.content.trim().length > 0
  }
}

module.exports = ContentExtractor