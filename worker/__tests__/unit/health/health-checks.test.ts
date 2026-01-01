/**
 * @file worker/__tests__/unit/health/health-checks.test.ts
 * @purpose Unit tests for health check factories
 * @functionality
 * - Tests createDatabaseCheck returns correct structure
 * - Tests database check reports healthy/unhealthy status
 * - Tests createSchedulerCheck returns correct structure
 * - Tests scheduler check reports running/stopped status
 * @dependencies
 * - vitest globals
 * - @/health (createDatabaseCheck, createSchedulerCheck)
 * - @/scheduler (Scheduler)
 */

import { createDatabaseCheck, createSchedulerCheck } from '@/health';
import { Scheduler } from '@/scheduler';

// Mock prisma
vi.mock('@/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

// Import after mocking
import { prisma } from '@/prisma';

describe('createDatabaseCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a health check with correct name', () => {
    const check = createDatabaseCheck();

    expect(check.name).toBe('database');
  });

  it('should be marked as critical', () => {
    const check = createDatabaseCheck();

    expect(check.critical).toBe(true);
  });

  it('should return healthy when database query succeeds', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '1': 1 }]);

    const check = createDatabaseCheck();
    const result = await check.check();

    expect(result.status).toBe('healthy');
    expect(result.message).toContain('active');
  });

  it('should return unhealthy when database query fails', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection failed'));

    const check = createDatabaseCheck();
    const result = await check.check();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Connection failed');
  });

  it('should return unhealthy with generic message for non-Error', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue('Unknown error');

    const check = createDatabaseCheck();
    const result = await check.check();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Database connection failed');
  });
});

describe('createSchedulerCheck', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  it('should return a health check with correct name', () => {
    const check = createSchedulerCheck(scheduler);

    expect(check.name).toBe('scheduler');
  });

  it('should be marked as critical', () => {
    const check = createSchedulerCheck(scheduler);

    expect(check.critical).toBe(true);
  });

  it('should return unhealthy when scheduler is not running', async () => {
    // Scheduler is not started
    const check = createSchedulerCheck(scheduler);
    const result = await check.check();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('not running');
  });

  it('should return healthy when scheduler is running', async () => {
    scheduler.start();

    const check = createSchedulerCheck(scheduler);
    const result = await check.check();

    expect(result.status).toBe('healthy');
    expect(result.message).toContain('running');

    scheduler.stop();
  });

  it('should include job count in message when running', async () => {
    scheduler.start();

    const check = createSchedulerCheck(scheduler);
    const result = await check.check();

    expect(result.message).toContain('0 job(s)');

    scheduler.stop();
  });

  it('should return unhealthy after scheduler is stopped', async () => {
    scheduler.start();
    scheduler.stop();

    const check = createSchedulerCheck(scheduler);
    const result = await check.check();

    expect(result.status).toBe('unhealthy');
  });
});
