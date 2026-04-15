// jest.setup.ts

// Mocking the logger to prevent test logs from cluttering the console
jest.mock('./src/config/logger.config', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));
