jest.mock('@whiskeysockets/baileys', () => ({
    jidNormalizedUser: jest.fn(id => id)
}), { virtual: true });

const moderationService = require('../src/services/moderation');

jest.mock('../src/config/database', () => ({
    db: {
        prepare: jest.fn().mockReturnValue({
            run: jest.fn(),
            get: jest.fn().mockReturnValue({}),
            all: jest.fn().mockReturnValue([])
        })
    }
}));

jest.mock('../src/models', () => ({
    Session: {
        findById: jest.fn(),
        updateAIStats: jest.fn()
    },
    User: {
        findByEmail: jest.fn()
    },
    ActivityLog: {
        logMessageSend: jest.fn()
    }
}));

jest.mock('../src/services/CreditService', () => ({
    deduct: jest.fn().mockReturnValue(true),
    add: jest.fn()
}));

jest.mock('../src/services/QueueService', () => ({
    enqueue: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/utils/logger', () => ({
    log: jest.fn()
}));

describe('Moderation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isGroupAdmin', () => {
        test('should return true if user is admin', () => {
            const metadata = {
                id: '123@g.us',
                participants: [
                    { id: 'admin@s.whatsapp.net', admin: 'admin' },
                    { id: 'user@s.whatsapp.net', admin: null }
                ]
            };
            const isAdmin = moderationService.isGroupAdmin(metadata, 'admin@s.whatsapp.net', null, 'session-1');
            expect(isAdmin).toBe(true);
        });

        test('should return false if user is not admin', () => {
            const metadata = {
                id: '123@g.us',
                participants: [
                    { id: 'admin@s.whatsapp.net', admin: 'admin' },
                    { id: 'user@s.whatsapp.net', admin: null }
                ]
            };
            const isAdmin = moderationService.isGroupAdmin(metadata, 'user@s.whatsapp.net', null, 'session-1');
            expect(isAdmin).toBe(false);
        });

        test('should return false if participants missing', () => {
             const metadata = { id: '123@g.us' };
             const isAdmin = moderationService.isGroupAdmin(metadata, 'user@s.whatsapp.net', null, 'session-1');
             expect(isAdmin).toBe(false);
        });
    });

    describe('handleIncomingMessage', () => {
        test('should not block non-group messages', async () => {
            const msg = { key: { remoteJid: 'user@s.whatsapp.net' } };
            const sock = { user: { id: 'bot@s.whatsapp.net' } };
            const result = await moderationService.handleIncomingMessage(sock, 'session-1', msg);
            expect(result).toBe(false);
        });
    });
});
