/**
 * @file src/utils/fileUtils.ts
 * @purpose Utility functions for file import/export operations
 * @functionality
 * - Exports assessment responses to downloadable JSON file
 * - Reads and parses JSON from uploaded file
 * - Validates response structure against AssessmentResponses type
 * @dependencies
 * - @/types/assessment.types (AssessmentResponses)
 */

import type { AssessmentResponses } from '@/types/assessment.types';

const REQUIRED_FIELDS: (keyof AssessmentResponses)[] = [
  'peak_energy_times',
  'low_energy_times',
  'energy_consistency',
  'energy_drains',
  'energy_restores',
  'mood_triggers_negative',
  'motivation_reliability',
  'willpower_pattern',
  'identity_statements',
  'others_describe',
  'automatic_behaviors',
  'keystone_behaviors',
  'core_values',
  'natural_strengths',
  'resistance_patterns',
  'identity_clarity',
];

export const exportToJson = (
  data: AssessmentResponses,
  filename: string = 'identity-assessment-responses.json'
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
  const arrayFields = ['peak_energy_times', 'low_energy_times', 'mood_triggers_negative', 'core_values'];
  for (const field of arrayFields) {
    if (!Array.isArray(record[field])) {
      return false;
    }
  }

  // Validate number fields (scales)
  const numberFields = ['energy_consistency', 'motivation_reliability', 'identity_clarity'];
  for (const field of numberFields) {
    if (typeof record[field] !== 'number') {
      return false;
    }
  }

  // Validate string fields
  const stringFields = [
    'energy_drains',
    'energy_restores',
    'willpower_pattern',
    'identity_statements',
    'others_describe',
    'automatic_behaviors',
    'keystone_behaviors',
    'natural_strengths',
    'resistance_patterns',
  ];
  for (const field of stringFields) {
    if (typeof record[field] !== 'string') {
      return false;
    }
  }

  return true;
};
