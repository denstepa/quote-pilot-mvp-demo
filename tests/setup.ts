// Test setup file
// Add any global test configuration here

// Verify that required environment variables are loaded
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not found in environment. Make sure .env.test is configured properly.');
}

// Mock console methods if needed
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}; 