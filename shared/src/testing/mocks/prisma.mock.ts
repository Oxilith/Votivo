/**
 * @file shared/src/testing/mocks/prisma.mock.ts
 * @purpose Type-safe Prisma client mock factory
 * @functionality
 * - Creates deep mock of Prisma client without importing the generated client
 * - Provides type-safe model mocks for all database models
 * - Supports transaction mocking with callback execution
 * @dependencies
 * - vitest for mock function creation
 */



import type { Mock } from "vitest";

/**
 * Model names in the Prisma schema.
 * Single source of truth - used for both interface definition and reset operations.
 */
const MODEL_NAMES = [
  'user',
  'refreshToken',
  'passwordResetToken',
  'emailVerifyToken',
  'assessment',
  'analysis',
  'prompt',
  'promptVariant',
  'promptVersion',
  'aBTest',
  'aBVariant',
  'aBVariantConfig',
] as const;

/**
 * Type representing valid model names from the schema.
 */
type ModelName = (typeof MODEL_NAMES)[number];

/**
 * Generic mock interface for Prisma model operations
 */
export interface ModelMock {
  findUnique: Mock;
  findUniqueOrThrow: Mock;
  findFirst: Mock;
  findFirstOrThrow: Mock;
  findMany: Mock;
  create: Mock;
  createMany: Mock;
  update: Mock;
  updateMany: Mock;
  upsert: Mock;
  delete: Mock;
  deleteMany: Mock;
  count: Mock;
  aggregate: Mock;
  groupBy: Mock;
}

/**
 * Model properties mapped from MODEL_NAMES.
 * Ensures interface stays in sync with the const array.
 */
type ModelProperties = Record<ModelName, ModelMock>;

/**
 * Mock Prisma client interface covering all models from the schema.
 * Model properties are derived from MODEL_NAMES to ensure consistency.
 */
export interface MockPrismaClient extends ModelProperties {
  // Client lifecycle methods
  $connect: Mock;
  $disconnect: Mock;

  // Transaction support
  $transaction: Mock & (<T>(callback: (tx: MockPrismaClient) => Promise<T>) => Promise<T>);

  // Raw query support
  $executeRaw: Mock;
  $executeRawUnsafe: Mock;
  $queryRaw: Mock;
  $queryRawUnsafe: Mock;
}

/**
 * Creates a mock for a single Prisma model with all standard operations.
 *
 * @returns Model mock with all CRUD operations
 */
function createModelMock(): ModelMock {
  return {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

/**
 * Creates a type-safe mock of the Prisma client.
 * All model operations are mocked with vi.fn() and return undefined by default.
 *
 * @returns Mock Prisma client with all models and operations
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrisma();
 *
 * // Set up specific mock behavior
 * mockPrisma.user.findUnique.mockResolvedValue({ id: '123', email: 'test@example.com' });
 *
 * // Inject into service
 * const service = new UserService(mockPrisma as unknown as PrismaClient);
 * ```
 */
export function createMockPrisma(): MockPrismaClient {
  const prisma: MockPrismaClient = {
    // User authentication models
    user: createModelMock(),
    refreshToken: createModelMock(),
    passwordResetToken: createModelMock(),
    emailVerifyToken: createModelMock(),

    // User data models
    assessment: createModelMock(),
    analysis: createModelMock(),

    // Prompt models
    prompt: createModelMock(),
    promptVariant: createModelMock(),
    promptVersion: createModelMock(),

    // A/B testing models
    aBTest: createModelMock(),
    aBVariant: createModelMock(),
    aBVariantConfig: createModelMock(),

    // Client lifecycle methods
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),

    // Transaction - creates a FRESH mock instance for isolation.
    // Note: Mock setups on the parent client won't propagate to transaction.
    // Set up mocks within the transaction callback if needed, or use
    // createTransactionAwareMockPrisma() if state sharing is required.
    $transaction: vi.fn(async (callback: (tx: MockPrismaClient) => Promise<unknown>): Promise<unknown> => {
      const txMock = createMockPrisma();
      return callback(txMock);
    }) as MockPrismaClient['$transaction'],

    // Raw queries
    $executeRaw: vi.fn().mockResolvedValue(0),
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
  };

  return prisma;
}

/**
 * Resets all mocks on a MockPrismaClient.
 * Useful in beforeEach to ensure clean state between tests.
 *
 * @param prisma - The mock Prisma client to reset
 *
 * @example
 * ```typescript
 * let mockPrisma: MockPrismaClient;
 *
 * beforeEach(() => {
 *   mockPrisma = createMockPrisma();
 * });
 *
 * afterEach(() => {
 *   resetMockPrisma(mockPrisma);
 * });
 * ```
 */
export function resetMockPrisma(prisma: MockPrismaClient): void {
  for (const modelName of MODEL_NAMES) {
    const model = prisma[modelName];
    Object.values(model).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReset' in mock) {
        (mock as Mock).mockReset();
      }
    });
  }

  // Reset lifecycle and transaction mocks
  prisma.$connect.mockReset();
  prisma.$disconnect.mockReset();
  prisma.$transaction.mockReset();
  prisma.$executeRaw.mockReset();
  prisma.$executeRawUnsafe.mockReset();
  prisma.$queryRaw.mockReset();
  prisma.$queryRawUnsafe.mockReset();
}

/**
 * Creates a hoisted mock for use with vi.mock().
 * This pattern is used when you need to mock the Prisma client at module level.
 *
 * @example
 * ```typescript
 * const mockPrisma = vi.hoisted(() => createMockPrisma());
 *
 * vi.mock('@/prisma', () => ({
 *   prisma: mockPrisma,
 * }));
 * ```
 */
export const createHoistedPrismaMock = (): MockPrismaClient => createMockPrisma();

/**
 * Creates a mock Prisma client where transactions share state with the parent.
 * Use this when your tests need mock setups to propagate into $transaction callbacks.
 *
 * Unlike createMockPrisma(), the $transaction callback receives the same mock instance,
 * so mock configurations set on the parent will be available inside the transaction.
 *
 * @returns Mock Prisma client with transaction state sharing
 *
 * @example
 * ```typescript
 * const mockPrisma = createTransactionAwareMockPrisma();
 * mockPrisma.user.findUnique.mockResolvedValue({ id: '123', email: 'test@example.com' });
 *
 * // This will use the same mock setup inside the transaction
 * await service.doSomethingWithTransaction(); // internally calls $transaction
 * // The tx.user.findUnique inside will return { id: '123', email: 'test@example.com' }
 * ```
 */
export function createTransactionAwareMockPrisma(): MockPrismaClient {
  const prisma = createMockPrisma();

  // Override $transaction to pass parent mock instead of fresh instance
  prisma.$transaction = vi.fn(
    async (callback: (tx: MockPrismaClient) => Promise<unknown>): Promise<unknown> => {
      return callback(prisma);
    }
  ) as MockPrismaClient['$transaction'];

  return prisma;
}
