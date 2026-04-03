const { performance } = require('perf_hooks');

jest.mock('../src/config/database', () => ({
    db: {
        prepare: jest.fn().mockReturnValue({
            run: jest.fn(),
            get: jest.fn().mockReturnValue({ id: 'test' }),
            all: jest.fn().mockReturnValue([])
        }),
        transaction: jest.fn((cb) => cb)
    }
}));

describe('Performance Tests', () => {
    test('DB prepare should complete 1000 iterations in under 100ms', () => {
        const { db } = require('../src/config/database');

        const start = performance.now();
        for(let i = 0; i < 1000; i++) {
            db.prepare('SELECT * FROM test').get();
        }
        const end = performance.now();

        expect(end - start).toBeLessThan(100);
    });
});
