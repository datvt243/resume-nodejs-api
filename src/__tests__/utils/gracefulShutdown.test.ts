import type { Server } from 'http';
import { createShutdown } from '@/utils/gracefulShutdown';
import { closeRedis } from '@/services/redis';

const calls: string[] = [];
const mockDisconnect = jest.fn(() => {
  calls.push('mongo');
  return Promise.resolve();
});

jest.mock('@/services/redis', () => ({ closeRedis: jest.fn() }));
jest.mock('@/database/mongo.db', () => ({
  MongoDBConnection: { getInstance: () => ({ disconnect: mockDisconnect }) },
}));
jest.mock('@/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

const mockClose = jest.fn();
const fakeServer = (closeImpl: (cb: (err?: Error) => void) => void) => {
  mockClose.mockImplementation((cb: (err?: Error) => void) => {
    calls.push('http');
    closeImpl(cb);
  });
  return { close: mockClose } as unknown as Server;
};

describe('createShutdown', () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    calls.length = 0;
    jest.clearAllMocks();
    (closeRedis as jest.Mock).mockImplementation(() => {
      calls.push('redis');
      return Promise.resolve();
    });
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    jest.useRealTimers();
  });

  it('closes HTTP, then Redis, then Mongo, then exits 0', async () => {
    const server = fakeServer((cb) => cb());
    await createShutdown(server)('SIGTERM');

    expect(calls).toEqual(['http', 'redis', 'mongo']);
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('runs only once when a second signal arrives', async () => {
    const server = fakeServer((cb) => cb());
    const shutdown = createShutdown(server);
    await Promise.all([shutdown('SIGTERM'), shutdown('SIGINT')]);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledTimes(1);
  });

  it('still closes Redis and Mongo when the HTTP close errors', async () => {
    const server = fakeServer((cb) => cb(new Error('ERR_SERVER_NOT_RUNNING')));
    await createShutdown(server)('SIGTERM');

    expect(calls).toEqual(['http', 'redis', 'mongo']);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('force-exits 1 when draining hangs past the timeout', () => {
    jest.useFakeTimers();
    const server = fakeServer(() => undefined); // never calls back
    void createShutdown(server, 50)('SIGTERM');

    jest.advanceTimersByTime(50);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(calls).toEqual(['http']);
  });
});
