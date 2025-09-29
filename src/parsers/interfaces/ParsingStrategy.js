/**
 * 파싱 전략 인터페이스
 * Strategy 패턴을 구현하여 다양한 파싱 방법을 지원
 */
class ParsingStrategy {
  /**
   * 파싱 전략을 실행합니다
   * @param {string} url - 파싱할 URL
   * @param {Object} options - 파싱 옵션
   * @returns {Promise<ParsedContent>} 파싱된 콘텐츠
   */
  async parse(url, options = {}) {
    throw new Error('parse method must be implemented')
  }

  /**
   * 이 전략이 해당 URL/콘텐츠 타입을 지원하는지 확인
   * @param {string} url - 확인할 URL
   * @param {string} contentType - 콘텐츠 타입
   * @returns {boolean} 지원 여부
   */
  supports(url, contentType) {
    throw new Error('supports method must be implemented')
  }

  /**
   * 전략의 이름을 반환
   * @returns {string} 전략 이름
   */
  getStrategyName() {
    throw new Error('getStrategyName method must be implemented')
  }

  /**
   * 전략의 신뢰도를 반환 (0-100)
   * @param {string} url - 평가할 URL
   * @returns {number} 신뢰도 점수
   */
  getConfidenceScore(url) {
    return 50 // 기본 신뢰도
  }

  /**
   * 파싱 전 준비 작업
   * @param {Object} options - 옵션
   */
  async prepare(options = {}) {
    // 기본적으로는 아무것도 하지 않음
  }

  /**
   * 파싱 후 정리 작업
   */
  async cleanup() {
    // 기본적으로는 아무것도 하지 않음
  }
}

module.exports = ParsingStrategy