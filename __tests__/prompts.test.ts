import { describe, it, expect } from 'vitest';
import { getSystemPrompt, SUBJECT_PROMPTS } from '@/lib/prompts';

describe('Prompts Library', () => {
  it('should define prompts for all expected subjects', () => {
    expect(SUBJECT_PROMPTS['Math']).toBeDefined();
    expect(SUBJECT_PROMPTS['Science']).toBeDefined();
    expect(SUBJECT_PROMPTS['English / Language Arts']).toBeDefined();
    expect(SUBJECT_PROMPTS['History']).toBeDefined();
    expect(SUBJECT_PROMPTS['Software Engineering']).toBeDefined();
  });

  it('should generate system prompts that include the READY_TO_GENERATE token', () => {
    const mathPrompt = getSystemPrompt('Math');
    expect(mathPrompt).toContain('[READY_TO_GENERATE]');
    expect(mathPrompt).toContain('Math tutor assistant');
  });

  it('should fallback to a default prompt for unknown subjects', () => {
    const unknownPrompt = getSystemPrompt('Unknown Subject');
    expect(unknownPrompt).toContain('expert tutor assistant');
    expect(unknownPrompt).toContain('[READY_TO_GENERATE]');
  });
});
