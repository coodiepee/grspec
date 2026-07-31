import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('legacy-cleanup retirement', () => {
  it('does not ship the closed-window legacy-cleanup module', () => {
    const modulePath = path.join(process.cwd(), 'src/core/legacy-cleanup.ts');
    expect(existsSync(modulePath)).toBe(false);
  });
});
