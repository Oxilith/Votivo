/**
 * @file src/utils/fileUtils.ts
 * @purpose Utility functions for file import/export operations
 * @functionality
 * - Exports assessment responses to downloadable JSON file
 * - Reads and parses JSON from uploaded file
 * - Validates response structure against AssessmentResponses type
 * @dependencies
 * - @/types/assessment.types (AssessmentResponses)
 * - @shared/index (REQUIRED_FIELDS, ARRAY_FIELDS, NUMBER_FIELDS, STRING_FIELDS)
 */

import type { AssessmentResponses } from '@/types';
import {
  REQUIRED_FIELDS,
  ARRAY_FIELDS,
  NUMBER_FIELDS,
  STRING_FIELDS,
} from 'shared';

export const exportToJson = (
  data: AssessmentResponses,
  filename: string = 'votive-responses.json'
): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJson = (file: File): Promise<AssessmentResponses> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (validateResponses(data)) {
          resolve(data);
        } else {
          reject(new Error('Invalid response structure. Please ensure the file contains valid assessment data.'));
        }
      } catch {
        reject(new Error('Invalid JSON file. Please upload a valid JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const validateResponses = (data: unknown): data is AssessmentResponses => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const record = data as Record<string, unknown>;

  // Check all required fields exist
  for (const field of REQUIRED_FIELDS) {
    if (!(field in record)) {
      return false;
    }
  }

  // Validate array fields
  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(record[field])) {
      return false;
    }
  }

  // Validate number fields (scales)
  for (const field of NUMBER_FIELDS) {
    if (typeof record[field] !== 'number') {
      return false;
    }
  }

  // Validate string fields
  for (const field of STRING_FIELDS) {
    if (typeof record[field] !== 'string') {
      return false;
    }
  }

  return true;
};
