/**
 * @file shared/src/tracing.ts
 * @purpose W3C Trace Context utilities for distributed tracing
 * @functionality
 * - Generates W3C traceparent headers (OpenTelemetry compatible)
 * - Parses incoming traceparent headers
 * - Creates child spans with propagated trace IDs
 * - Provides utilities for trace ID and span ID generation
 * - Uses Web Crypto API for isomorphic browser/Node.js support
 * @dependencies
 * - Web Crypto API (globalThis.crypto)
 */

/**
 * W3C Trace Context header names
 * @see https://www.w3.org/TR/trace-context/
 */
export const TRACEPARENT_HEADER = 'traceparent';
export const TRACESTATE_HEADER = 'tracestate';

/**
 * Parsed W3C Trace Context
 */
export interface TraceContext {
  /** 32 hex chars (128-bit) */
  traceId: string;
  /** 16 hex chars (64-bit) */
  spanId: string;
  /** 2 hex chars (trace flags) */
  traceFlags: string;
  /** 2 hex chars (always '00' for W3C v1) */
  version: string;
}

/**
 * Extracted trace information for logging
 */
export interface TraceInfo {
  traceparent: string;
  traceId: string;
  spanId: string;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate cryptographically secure random bytes
 * Uses Web Crypto API (available in browsers and Node.js 15+)
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a random trace ID (32 hex chars = 128 bits)
 */
export function generateTraceId(): string {
  return bytesToHex(getRandomBytes(16));
}

/**
 * Generate a random span ID (16 hex chars = 64 bits)
 */
export function generateSpanId(): string {
  return bytesToHex(getRandomBytes(8));
}

/**
 * Create a W3C traceparent header value
 *
 * @param ctx - Optional partial trace context (traceId preserved, spanId always new)
 * @returns Formatted traceparent header value
 */
export function createTraceparent(ctx: Partial<TraceContext> = {}): string {
  const version = ctx.version ?? '00';
  const traceId = ctx.traceId ?? generateTraceId();
  const spanId = generateSpanId(); // Always generate new span ID
  const flags = ctx.traceFlags ?? '01'; // 01 = sampled
  return `${version}-${traceId}-${spanId}-${flags}`;
}

/**
 * Parse a W3C traceparent header value
 *
 * @param header - The traceparent header value
 * @returns Parsed trace context or null if invalid
 */
export function parseTraceparent(header: string | undefined | null): TraceContext | null {
  if (!header) return null;

  const parts = header.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, spanId, traceFlags] = parts as [string, string, string, string];

  // Validate format
  if (
    version.length !== 2 ||
    traceId.length !== 32 ||
    spanId.length !== 16 ||
    traceFlags.length !== 2
  ) {
    return null;
  }

  return {
    version,
    traceId,
    spanId,
    traceFlags,
  };
}

/**
 * Extract trace context from headers or create a new one
 *
 * If an existing traceparent header is present, the trace ID is preserved
 * but a new span ID is generated for this service's span.
 *
 * @param headers - Request headers (case-insensitive lookup)
 * @returns Trace info for logging and propagation
 */
export function extractOrCreateTrace(
  headers: Record<string, string | string[] | undefined>
): TraceInfo {
  // Look for traceparent header (case-insensitive)
  const headerValue = headers[TRACEPARENT_HEADER] ?? headers[TRACEPARENT_HEADER.toLowerCase()];
  const traceparentHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  const existing = parseTraceparent(traceparentHeader);

  if (existing) {
    // Continue trace with new span
    const newSpanId = generateSpanId();
    return {
      traceparent: createTraceparent({
        version: existing.version,
        traceId: existing.traceId,
        traceFlags: existing.traceFlags,
      }),
      traceId: existing.traceId,
      spanId: newSpanId,
    };
  }

  // Start new trace
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  return {
    traceparent: createTraceparent({ traceId }),
    traceId,
    spanId,
  };
}
