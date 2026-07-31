import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('feedback-loop retirement', () => {
  it('does not ship the unused feedback-loop module', () => {
    const modulePath = path.join(process.cwd(), 'src/core/feedback-loop.ts');
    expect(existsSync(modulePath)).toBe(false);
  });
});
