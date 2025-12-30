/**
 * @file shared/src/testing/mocks/handlers.ts
 * @purpose MSW request handlers for external API mocking
 * @functionality
 * - Mocks Anthropic Claude API responses
 * - Provides configurable response behaviors for different scenarios
 * - Supports error scenario simulation (rate limits, network errors)
 * @dependencies
 * - msw for request interception and response mocking
 */

import { http, HttpResponse, delay } from 'msw';

/**
 * Anthropic API message request body structure
 */
interface ClaudeMessageRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Anthropic API message response structure
 */
interface ClaudeMessageResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Default mock analysis result for Claude API responses
 */
const DEFAULT_MOCK_ANALYSIS = {
  language: 'en',
  patterns: [],
  contradictions: [],
  blindSpots: [],
  leveragePoints: [],
  risks: [],
  identitySynthesis: {
    currentIdentityCore: 'Mock identity analysis result',
    hiddenStrengths: ['Mock strength'],
    keyTension: 'Mock key tension',
    nextIdentityStep: 'Mock next step',
  },
};

/**
 * Creates a successful Claude API response
 */
function createClaudeResponse(
  model: string,
  content: string,
  inputTokens: number = 100,
  outputTokens: number = 500
): ClaudeMessageResponse {
  return {
    id: `msg_mock_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: content }],
    model,
    stop_reason: 'end_turn',
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  };
}

/**
 * Default Anthropic API handlers for successful responses
 */
export const anthropicHandlers = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = (await request.json()) as ClaudeMessageRequest;

    return HttpResponse.json(
      createClaudeResponse(
        body.model,
        JSON.stringify(DEFAULT_MOCK_ANALYSIS)
      )
    );
  }),
];

/**
 * Creates a handler that returns a rate limit error
 *
 * @param retryAfter - Number of seconds until retry is allowed
 * @returns MSW handler that returns 429 response
 *
 * @example
 * ```typescript
 * server.use(createRateLimitHandler(60));
 * await expect(service.analyze()).rejects.toThrow('Rate limit');
 * ```
 */
export function createRateLimitHandler(retryAfter: number = 60) {
  return http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json(
      {
        type: 'error',
        error: {
          type: 'rate_limit_error',
          message: 'Rate limit exceeded. Please retry after the specified time.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    );
  });
}

/**
 * Creates a handler that simulates a network error
 *
 * @returns MSW handler that returns a network error
 *
 * @example
 * ```typescript
 * server.use(createNetworkErrorHandler());
 * await expect(service.analyze()).rejects.toThrow();
 * ```
 */
export function createNetworkErrorHandler() {
  return http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.error();
  });
}

/**
 * Creates a handler that returns a slow response
 *
 * @param delayMs - Delay in milliseconds before responding
 * @param content - Optional custom response content
 * @returns MSW handler with delayed response
 *
 * @example
 * ```typescript
 * server.use(createSlowResponseHandler(5000)); // 5 second delay
 * ```
 */
export function createSlowResponseHandler(delayMs: number, content?: string) {
  return http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    await delay(delayMs);

    const body = (await request.json()) as ClaudeMessageRequest;
    return HttpResponse.json(
      createClaudeResponse(
        body.model,
        content ?? JSON.stringify(DEFAULT_MOCK_ANALYSIS)
      )
    );
  });
}

/**
 * Creates a handler that returns a custom response
 *
 * @param content - Custom response content (will be JSON stringified if object)
 * @param options - Optional response configuration
 * @returns MSW handler with custom response
 *
 * @example
 * ```typescript
 * server.use(createCustomResponseHandler({
 *   patterns: [{ title: 'Test Pattern', ... }],
 *   ...
 * }));
 * ```
 */
export function createCustomResponseHandler(
  content: unknown,
  options: {
    inputTokens?: number;
    outputTokens?: number;
    delayMs?: number;
  } = {}
) {
  return http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    if (options.delayMs) {
      await delay(options.delayMs);
    }

    const body = (await request.json()) as ClaudeMessageRequest;
    const responseContent = typeof content === 'string' ? content : JSON.stringify(content);

    return HttpResponse.json(
      createClaudeResponse(
        body.model,
        responseContent,
        options.inputTokens,
        options.outputTokens
      )
    );
  });
}

/**
 * Creates a handler that returns an API error
 *
 * @param errorType - Type of error (e.g., 'invalid_request_error', 'authentication_error')
 * @param message - Error message
 * @param status - HTTP status code
 * @returns MSW handler that returns an error response
 */
export function createErrorHandler(
  errorType: string,
  message: string,
  status: number = 400
) {
  return http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json(
      {
        type: 'error',
        error: {
          type: errorType,
          message,
        },
      },
      { status }
    );
  });
}

/**
 * Creates a handler that returns a server overloaded error (529)
 *
 * @returns MSW handler that returns 529 response
 */
export function createOverloadedHandler() {
  return createErrorHandler(
    'overloaded_error',
    'The API is temporarily overloaded. Please try again later.',
    529
  );
}

/**
 * Creates a handler that returns an authentication error (401)
 *
 * @returns MSW handler that returns 401 response
 */
export function createAuthenticationErrorHandler() {
  return createErrorHandler(
    'authentication_error',
    'Invalid API key provided.',
    401
  );
}

/**
 * Default handler set for standard tests
 */
export const handlers = [...anthropicHandlers];
