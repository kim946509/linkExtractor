/**
 * 파서 모듈의 메인 엔트리 포인트
 * 모든 파싱 관련 기능을 통합하여 제공
 */

const parserManager = require('./ParserManager')
const parserFactory = require('./ParserFactory')
const ContentExtractor = require('./interfaces/ContentExtractor')
const ParsingStrategy = require('./interfaces/ParsingStrategy')
const ExtractedContent = require('./models/ExtractedContent')
const ParsedContent = require('./models/ParsedContent')

/**
 * 파서 모듈 초기화
 * 애플리케이션 시작 시 호출되어야 함
 */
async function initialize() {
  await parserFactory.initialize()
}

/**
 * URL에서 콘텐츠를 추출합니다
 * @param {string} url - 추출할 URL
 * @param {Object} options - 추출 옵션
 * @returns {Promise<ExtractedContent>} 추출된 콘텐츠
 */
async function extractContent(url, options = {}) {
  return await parserManager.extractContent(url, options)
}

/**
 * URL에서 콘텐츠를 파싱합니다
 * @param {string} url - 파싱할 URL
 * @param {string} contentType - 콘텐츠 타입
 * @param {Object} options - 파싱 옵션
 * @returns {Promise<ParsedContent>} 파싱된 콘텐츠
 */
async function parseContent(url, contentType = '', options = {}) {
  return await parserManager.parseContent(url, contentType, options)
}

/**
 * 파서 상태 정보를 반환합니다
 * @returns {Object} 상태 정보
 */
function getStatus() {
  return parserFactory.getStatus()
}

/**
 * 새로운 파싱 전략을 등록합니다
 * @param {ParsingStrategy} strategy - 등록할 전략
 * @param {boolean} isDefault - 기본 전략 여부
 */
function registerStrategy(strategy, isDefault = false) {
  parserFactory.addStrategy(strategy, isDefault)
}

/**
 * 새로운 콘텐츠 추출기를 등록합니다
 * @param {ContentExtractor} extractor - 등록할 추출기
 */
function registerExtractor(extractor) {
  parserFactory.addExtractor(extractor)
}

/**
 * 도메인별 특화 추출기를 생성합니다
 * @param {string} domain - 도메인명
 * @param {Object} options - 옵션
 * @returns {ContentExtractor} 생성된 추출기
 */
function createDomainExtractor(domain, options = {}) {
  return parserFactory.createDomainSpecificExtractor(domain, options)
}

/**
 * 사용자 정의 파싱 전략을 생성합니다
 * @param {string} name - 전략명
 * @param {Object} config - 설정
 * @returns {ParsingStrategy} 생성된 전략
 */
function createCustomStrategy(name, config = {}) {
  return parserFactory.createCustomStrategy(name, config)
}

module.exports = {
  // 초기화
  initialize,

  // 메인 기능
  extractContent,
  parseContent,

  // 상태 및 관리
  getStatus,

  // 동적 등록
  registerStrategy,
  registerExtractor,

  // 팩토리 기능
  createDomainExtractor,
  createCustomStrategy,

  // 클래스 및 매니저 노출
  parserManager,
  parserFactory,

  // 인터페이스 및 모델
  ContentExtractor,
  ParsingStrategy,
  ExtractedContent,
  ParsedContent
}