/**
 * @file middleware/__tests__/tracing.middleware.test.ts
 * @purpose Unit tests for W3C Trace Context middleware
 * @functionality
 * - Tests trace extraction from existing headers
 * - Tests new trace creation when missing
 * - Tests request context attachment
 * - Tests response header propagation
 * - Tests middleware chain continuation
 * @dependencies
 * - vitest for testing framework
 * - tracingMiddleware under test
 * - shared/testing for mock utilities
 */

// Hoist mocks before imports
const { mockExtractOrCreateTrace } = vi.hoisted(() => ({
  mockExtractOrCreateTrace: vi.fn(),
}));

vi.mock('shared', async (importOriginal: () => Promise<typeof import('shared')>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    extractOrCreateTrace: mockExtractOrCreateTrace,
  };
});

import { tracingMiddleware } from '@/middleware/tracing.middleware';
import { createMockRequest, createMockResponse } from 'shared/testing';
import type { Request, Response, NextFunction } from 'express';
import { TRACEPARENT_HEADER, type TraceInfo } from 'shared';

// Extended mock request type to include traceContext
interface MockRequestWithTrace {
  headers: Record<string, string>;
  traceContext?: TraceInfo;
}

// Sample trace data
const SAMPLE_TRACE_ID = 'a1b2c3d4e5f6789012345678abcdef12';
const SAMPLE_SPAN_ID = 'abcd123456789012';
const SAMPLE_TRACEPARENT = `00-${SAMPLE_TRACE_ID}-${SAMPLE_SPAN_ID}-01`;

describe('tracingMiddleware', () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNext = vi.fn();
  });

  it('should extract trace from existing headers', () => {
    const traceInfo = {
      traceparent: SAMPLE_TRACEPARENT,
      traceId: SAMPLE_TRACE_ID,
      spanId: SAMPLE_SPAN_ID,
    };
    mockExtractOrCreateTrace.mockReturnValueOnce(traceInfo);

    const req = createMockRequest({
      headers: { [TRACEPARENT_HEADER]: SAMPLE_TRACEPARENT },
    });
    const res = createMockResponse();

    tracingMiddleware(
      req as unknown as Request,
      res as unknown as Response,
      mockNext
    );

    expect(mockExtractOrCreateTrace).toHaveBeenCalledWith(req.headers);
    expect((req as MockRequestWithTrace).traceContext).toEqual(traceInfo);
  });

  it('should create new trace when header is missing', () => {
    const newTraceInfo = {
      traceparent: SAMPLE_TRACEPARENT,
      traceId: SAMPLE_TRACE_ID,
      spanId: SAMPLE_SPAN_ID,
    };
    mockExtractOrCreateTrace.mockReturnValueOnce(newTraceInfo);

    const req = createMockRequest();
    const res = createMockResponse();

    tracingMiddleware(
      req as unknown as Request,
      res as unknown as Response,
      mockNext
    );

    expect(mockExtractOrCreateTrace).toHaveBeenCalledWith({});
    expect((req as MockRequestWithTrace).traceContext).toEqual(newTraceInfo);
  });

  it('should attach trace context to request', () => {
    const traceInfo = {
      traceparent: SAMPLE_TRACEPARENT,
      traceId: SAMPLE_TRACE_ID,
      spanId: SAMPLE_SPAN_ID,
    };
    mockExtractOrCreateTrace.mockReturnValueOnce(traceInfo);

    const req = createMockRequest();
    const res = createMockResponse();

    tracingMiddleware(
      req as unknown as Request,
      res as unknown as Response,
      mockNext
    );

    const reqWithTrace = req as MockRequestWithTrace;
    expect(reqWithTrace.traceContext).toBeDefined();
    expect(reqWithTrace.traceContext?.traceId).toBe(SAMPLE_TRACE_ID);
    expect(reqWithTrace.traceContext?.spanId).toBe(SAMPLE_SPAN_ID);
    expect(reqWithTrace.traceContext?.traceparent).toBe(SAMPLE_TRACEPARENT);
  });

  it('should set traceparent response header', () => {
    const traceInfo = {
      traceparent: SAMPLE_TRACEPARENT,
      traceId: SAMPLE_TRACE_ID,
      spanId: SAMPLE_SPAN_ID,
    };
    mockExtractOrCreateTrace.mockReturnValueOnce(traceInfo);

    const req = createMockRequest();
    const res = createMockResponse();

    tracingMiddleware(
      req as unknown as Request,
      res as unknown as Response,
      mockNext
    );

    expect(res.setHeader).toHaveBeenCalledWith(TRACEPARENT_HEADER, SAMPLE_TRACEPARENT);
  });

  it('should call next() to continue middleware chain', () => {
    mockExtractOrCreateTrace.mockReturnValueOnce({
      traceparent: SAMPLE_TRACEPARENT,
      traceId: SAMPLE_TRACE_ID,
      spanId: SAMPLE_SPAN_ID,
    });

    const req = createMockRequest();
    const res = createMockResponse();

    tracingMiddleware(
      req as unknown as Request,
      res as unknown as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
