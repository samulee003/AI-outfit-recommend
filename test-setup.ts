// Test setup file for vitest
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.API_KEY = 'test-api-key';
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};