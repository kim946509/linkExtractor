// Global test setup
process.env.NODE_ENV = 'test'
process.env.PORT = 3001
process.env.LOG_LEVEL = 'error'

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}