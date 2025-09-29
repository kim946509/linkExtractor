const ParserManager = require('../../../src/parsers/ParserManager')
const ContentExtractor = require('../../../src/parsers/interfaces/ContentExtractor')
const ParsingStrategy = require('../../../src/parsers/interfaces/ParsingStrategy')
const ExtractedContent = require('../../../src/parsers/models/ExtractedContent')
const ParsedContent = require('../../../src/parsers/models/ParsedContent')

// Mock 추출기
class MockExtractor extends ContentExtractor {
  constructor(name = 'mock', priority = 50) {
    super()
    this.name = name
    this.priority = priority
  }

  getName() {
    return this.name
  }

  getPriority() {
    return this.priority
  }

  canHandle(url) {
    return url.includes('example.com')
  }

  async extract(url, options = {}) {
    return new ExtractedContent({
      title: 'Mock Title',
      content: 'Mock content from ' + this.name,
      url: url
    })
  }
}

// Mock 전략
class MockStrategy extends ParsingStrategy {
  constructor(name = 'mock', confidence = 80) {
    super()
    this.name = name
    this.confidence = confidence
  }

  getStrategyName() {
    return this.name
  }

  supports(url, contentType) {
    return true
  }

  getConfidenceScore(url) {
    return this.confidence
  }

  async parse(url, options = {}) {
    return new ParsedContent({
      title: 'Mock Parsed Title',
      content: 'Mock parsed content',
      url: url,
      parsingStrategy: this.name,
      confidence: this.confidence
    })
  }
}

describe('ParserManager', () => {
  let parserManager

  beforeEach(() => {
    // 새로운 인스턴스를 위해 require 캐시 클리어
    delete require.cache[require.resolve('../../../src/parsers/ParserManager')]
    parserManager = require('../../../src/parsers/ParserManager')
  })

  describe('Extractor Registration', () => {
    test('should register extractor successfully', () => {
      const mockExtractor = new MockExtractor('test-extractor')

      expect(() => {
        parserManager.registerExtractor(mockExtractor)
      }).not.toThrow()

      expect(parserManager.getRegisteredExtractors()).toContain('test-extractor')
    })

    test('should throw error when registering invalid extractor', () => {
      const invalidExtractor = {}

      expect(() => {
        parserManager.registerExtractor(invalidExtractor)
      }).toThrow('Extractor must implement getName() method')
    })

    test('should find best extractor by priority', () => {
      const extractor1 = new MockExtractor('extractor1', 100)
      const extractor2 = new MockExtractor('extractor2', 50)

      parserManager.registerExtractor(extractor1)
      parserManager.registerExtractor(extractor2)

      const bestExtractor = parserManager.findBestExtractor('https://example.com/test')
      expect(bestExtractor.getName()).toBe('extractor2') // 낮은 우선순위 값이 더 높은 우선순위
    })
  })

  describe('Strategy Registration', () => {
    test('should register strategy successfully', () => {
      const mockStrategy = new MockStrategy('test-strategy')

      expect(() => {
        parserManager.registerStrategy(mockStrategy)
      }).not.toThrow()

      expect(parserManager.getRegisteredStrategies()).toContain('test-strategy')
    })

    test('should throw error when registering invalid strategy', () => {
      const invalidStrategy = {}

      expect(() => {
        parserManager.registerStrategy(invalidStrategy)
      }).toThrow('Strategy must implement getStrategyName() method')
    })

    test('should set default strategy', () => {
      const strategy1 = new MockStrategy('strategy1', 70)
      const strategy2 = new MockStrategy('strategy2', 90)

      parserManager.registerStrategy(strategy1)
      parserManager.registerStrategy(strategy2, true) // 기본 전략으로 설정

      // 기본 전략이 설정되었는지 확인하기 위해 confidence가 낮은 URL로 테스트
      const bestStrategy = parserManager.findBestStrategy('https://low-confidence.com')
      expect(bestStrategy.getStrategyName()).toBe('strategy2')
    })

    test('should find best strategy by confidence', () => {
      const strategy1 = new MockStrategy('strategy1', 70)
      const strategy2 = new MockStrategy('strategy2', 90)

      parserManager.registerStrategy(strategy1)
      parserManager.registerStrategy(strategy2)

      const bestStrategy = parserManager.findBestStrategy('https://example.com')
      expect(bestStrategy.getStrategyName()).toBe('strategy2') // 높은 신뢰도
    })
  })

  describe('Content Extraction', () => {
    test('should extract content successfully', async () => {
      const mockExtractor = new MockExtractor()
      parserManager.registerExtractor(mockExtractor)

      const result = await parserManager.extractContent('https://example.com/test')

      expect(result).toBeInstanceOf(ExtractedContent)
      expect(result.title).toBe('Mock Title')
      expect(result.url).toBe('https://example.com/test')
    })

    test('should throw error when no suitable extractor found', async () => {
      await expect(
        parserManager.extractContent('https://unsupported.com/test')
      ).rejects.toThrow('No suitable extractor found')
    })
  })

  describe('Content Parsing', () => {
    test('should parse content successfully', async () => {
      const mockStrategy = new MockStrategy()
      parserManager.registerStrategy(mockStrategy)

      const result = await parserManager.parseContent('https://example.com/test')

      expect(result).toBeInstanceOf(ParsedContent)
      expect(result.title).toBe('Mock Parsed Title')
      expect(result.parsingStrategy).toBe('mock')
    })

    test('should throw error when no suitable strategy found', async () => {
      // 전략 등록하지 않은 상태에서 테스트
      await expect(
        parserManager.parseContent('https://example.com/test')
      ).rejects.toThrow('No suitable parsing strategy found')
    })
  })
})