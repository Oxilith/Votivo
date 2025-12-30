/**
 * @file shared/src/testing/utils/index.ts
 * @purpose Barrel export for testing utility functions
 * @functionality
 * - Exports async utilities (flushPromises, advanceTimersAndFlush, runAllTimersAndFlush)
 * - Exports Express mock utilities (createMockRequest, createMockResponse, createMockNext)
 * @dependencies
 * - ./async.utils
 * - ./express.utils
 */

export {
  flushPromises,
  advanceTimersAndFlush,
  runAllTimersAndFlush,
} from './async.utils';

export {
  createMockRequest,
  createMockResponse,
  createMockNext,
  type MockRequest,
  type MockRequestOptions,
  type MockResponse,
  type MockNextFunction,
} from './express.utils';
