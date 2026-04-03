const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();

jest.mock('../src/config/database', () => ({
    db: {
        prepare: jest.fn().mockReturnValue({
            run: mockRun,
            get: mockGet,
            all: mockAll
        }),
        transaction: jest.fn((cb) => cb)
    }
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn()
}));

jest.mock('../src/services/NotificationService', () => ({
    send: jest.fn()
}));

jest.mock('../src/utils/logger', () => ({
    log: jest.fn()
}));

const CreditService = require('../src/services/CreditService');
const User = require('../src/models/User');

describe('CreditService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRun.mockClear();
        mockGet.mockClear();
        mockAll.mockClear();
    });

    describe('getBalance', () => {
        test('should return 0 if user not found', () => {
            User.findById.mockReturnValue(null);
            expect(CreditService.getBalance('user-1')).toBe(0);
        });

        test('should return user balance', () => {
            User.findById.mockReturnValue({ message_limit: 150 });
            expect(CreditService.getBalance('user-1')).toBe(150);
        });
    });

    describe('deduct', () => {
        test('should return false if user not found', () => {
            User.findById.mockReturnValue(null);
            expect(CreditService.deduct('user-1', 10)).toBe(false);
        });

        test('should bypass for admin', () => {
            User.findById.mockReturnValue({ role: 'admin' });
            expect(CreditService.deduct('user-1', 10)).toBe(true);
        });

        test('should return false if insufficient funds', () => {
            User.findById.mockReturnValue({ role: 'user', message_limit: 5 });
            expect(CreditService.deduct('user-1', 10)).toBe(false);
        });

        test('should return true and deduct if sufficient funds', () => {
            User.findById.mockReturnValue({ role: 'user', message_limit: 50 });
            expect(CreditService.deduct('user-1', 10)).toBe(true);
            expect(mockRun).toHaveBeenCalledTimes(2); // One for history, one for user
        });
    });

    describe('add', () => {
        test('should add credits and update history', () => {
            User.findById.mockReturnValue({ role: 'user', message_limit: 50 }); // For the getBalance call at the end
            const newBalance = CreditService.add('user-1', 10, 'credit', 'Test');
            expect(mockRun).toHaveBeenCalledTimes(2);
            expect(newBalance).toBe(50);
        });
    });

    describe('giveWelcomeCredits', () => {
        test('should not give if already given', () => {
            mockGet.mockReturnValue({ id: 'existing-record' });
            expect(CreditService.giveWelcomeCredits('user-1')).toBe(false);
        });

        test('should give if not already given', () => {
            mockGet.mockReturnValue(null);
            User.findById.mockReturnValue({ message_limit: 100 });
            expect(CreditService.giveWelcomeCredits('user-1')).toBe(true);
        });
    });

    describe('resetMonthlyCredits', () => {
        test('should reset successfully if user exists', () => {
            User.findById.mockReturnValue({ id: 'user-1' });
            CreditService.resetMonthlyCredits('user-1', 1000);
            expect(mockRun).toHaveBeenCalledTimes(2); // History + update
        });

        test('should abort if user not found', () => {
            User.findById.mockReturnValue(null);
            CreditService.resetMonthlyCredits('user-1', 1000);
            expect(mockRun).not.toHaveBeenCalled();
        });
    });
});
