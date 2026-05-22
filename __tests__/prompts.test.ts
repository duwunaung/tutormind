/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSystemPrompt, getPromptConfig, SUBJECT_PROMPTS } from '@/lib/prompts';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    promptTemplate: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Prompts Library', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

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

  describe('getPromptConfig', () => {
    it('should load dynamic template and temperature from database if exists', async () => {
      vi.mocked(prisma.promptTemplate.findUnique).mockResolvedValueOnce({
        id: '1',
        subject: 'Math',
        template: 'Custom Math Prompt',
        temperature: 1.2,
      } as any);

      const config = await getPromptConfig('Math');
      expect(config.systemPrompt).toContain('Custom Math Prompt');
      expect(config.systemPrompt).toContain('[READY_TO_GENERATE]');
      expect(config.temperature).toBe(1.2);
      expect(prisma.promptTemplate.create).not.toHaveBeenCalled();
    });

    it('should lazy-seed and create template in database if not found', async () => {
      vi.mocked(prisma.promptTemplate.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.promptTemplate.create).mockResolvedValueOnce({
        id: '2',
        subject: 'Math',
        template: SUBJECT_PROMPTS['Math'],
        temperature: 0.7,
      } as any);

      const config = await getPromptConfig('Math');
      expect(config.systemPrompt).toContain('Math tutor assistant');
      expect(config.temperature).toBe(0.7);
      expect(prisma.promptTemplate.create).toHaveBeenCalledWith({
        data: {
          subject: 'Math',
          template: SUBJECT_PROMPTS['Math'],
          temperature: 0.7,
        },
      });
    });
  });
});
