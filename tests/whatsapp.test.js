jest.useFakeTimers();

jest.mock('@whiskeysockets/baileys', () => ({
    __esModule: true,
    default: jest.fn(),
    makeWASocket: jest.fn(),
    useMultiFileAuthState: jest.fn().mockResolvedValue({ state: {}, saveCreds: jest.fn() }),
    DisconnectReason: { loggedOut: 401 },
    Browsers: { ubuntu: jest.fn().mockReturnValue(['Ubuntu', 'Chrome', '20.0.0']) },
    jidNormalizedUser: jest.fn(id => id)
}), { virtual: true });

jest.mock('../src/config/database', () => ({
    db: {
        prepare: jest.fn().mockReturnValue({
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn().mockReturnValue([])
        }),
        transaction: jest.fn((cb) => cb)
    }
}));

jest.mock('../src/models', () => ({
    Session: {
        findById: jest.fn(),
        updateStatus: jest.fn()
    }
}));

jest.mock('../src/utils/logger', () => ({
    log: jest.fn()
}));

const whatsappService = require('../src/services/whatsapp');
const fs = require('fs');
jest.mock('fs', () => {
    return {
        ...jest.requireActual('fs'),
        rmSync: jest.fn(),
        existsSync: jest.fn().mockReturnValue(true)
    };
});

describe('WhatsApp Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test('getSocket should return null for unknown session', () => {
        const socket = whatsappService.getSocket('unknown-session');
        expect(socket).toBeNull();
    });

    test('isConnected should return false for unknown session', () => {
        const status = whatsappService.isConnected('unknown-session');
        expect(status).toBe(false);
    });

    test('getActiveSessions should return an empty map initially', () => {
        const sessions = whatsappService.getActiveSessions();
        expect(sessions).toBeInstanceOf(Map);
        expect(sessions.size).toBe(0);
    });

    test('deleteSessionData should remove directory', async () => {
        // deleteSessionData expects a valid uuid format because of isValidId
        const validUUID = '123e4567-e89b-12d3-a456-426614174000';
        await whatsappService.deleteSessionData(validUUID);
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining(validUUID), expect.any(Object));
    });
});
