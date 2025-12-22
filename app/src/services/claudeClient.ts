/**
 * @file src/services/claudeClient.ts
 * @purpose Client service for interacting with Claude API
 * @functionality
 * - Sends prompts to Claude API with configurable settings
 * - Handles response parsing and error handling
 * - Cleans up markdown formatting from responses
 * - Returns both raw and cleaned response text
 * @dependencies
 * - @/types/prompt.types (PromptConfig)
 */

import type { PromptConfig } from '@/types/prompt.types';

export interface ClaudeResponse {
  text: string;
  rawResponse: string;
}

/**
 * Sends a prompt to Claude API and returns the response
 * @param config - Prompt configuration with model settings
 * @param userContent - User content to append to the prompt
 * @returns Promise with cleaned text and raw response
 */
export async function sendPrompt(config: PromptConfig, userContent: string): Promise<ClaudeResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      messages: [
        {
          role: 'user',
          content: config.prompt + userContent,
        },
      ],
    }),
  });

  const data = await response.json();

  if (data.content?.[0]?.text) {
    const rawText = data.content[0].text as string;
    // Clean up potential markdown formatting
    const cleanText = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return { text: cleanText, rawResponse: rawText };
  } else if (data.error) {
    throw new Error(data.error.message || 'API error');
  } else {
    throw new Error('Unexpected response format');
  }
}
