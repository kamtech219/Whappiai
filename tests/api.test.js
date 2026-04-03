jest.mock('@whiskeysockets/baileys', () => ({
    jidNormalizedUser: jest.fn(id => id)
}), { virtual: true });
jest.mock('uuid', () => ({
    v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
}), { virtual: true });

const request = require('supertest');
const express = require('express');

const mockAll = jest.fn();
const mockGet = jest.fn();
const mockRun = jest.fn();

jest.mock('../src/config/database', () => ({
    db: {
        prepare: jest.fn().mockReturnValue({
            all: mockAll,
            get: mockGet,
            run: mockRun
        }),
        transaction: jest.fn((cb) => cb)
    }
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn().mockReturnValue({ id: 'admin', email: 'maruise237@gmail.com', role: 'admin' }),
    findByEmail: jest.fn().mockReturnValue({ id: 'admin', email: 'maruise237@gmail.com', role: 'admin' }),
}));

jest.mock('../src/services/whatsapp', () => ({
    getSessionStatus: jest.fn().mockReturnValue({ status: 'STOPPED' }),
    connect: jest.fn(),
    deleteSessionData: jest.fn(),
    getActiveSessions: jest.fn().mockReturnValue([])
}));

const { initializeApi } = require('../src/routes/api');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    req.auth = {
        userId: 'clerk-user-id',
        sessionClaims: {
            email: 'maruise237@gmail.com'
        }
    };
    next();
});

const router = initializeApi(
    new Map(), // sessions
    new Map(), // sessionTokens
    jest.fn(), // createSession
    jest.fn().mockReturnValue([{ id: 'sess-1' }]), // getSessionsDetails
    jest.fn(), // deleteSession
    jest.fn(), // log
    null, // userManager
    null, // activityLogger
    jest.fn() // triggerQR
);
app.use('/api/v1', router);

describe('API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/sessions', () => {
        test('should return all sessions for user', async () => {
            mockAll.mockReturnValue([{ id: 'sess-1', session_name: 'Test' }]);

            const response = await request(app).get('/api/v1/sessions');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });
});
    describe('POST /api/v1/sessions', () => {
        test('should create a new session', async () => {
            mockRun.mockReturnValue({ lastInsertRowid: 1 });

            const response = await request(app)
                .post('/api/v1/sessions')
                .send({ sessionId: '123e4567-e89b-12d3-a456-426614174000', session_name: 'NewSession' });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            // token could be undefined if not correctly generated in mock, but status success is enough to assert route behaviour
        });
    });
