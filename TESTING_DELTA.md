# TESTING_DELTA

## Existing Test Strategy
**Current Status**: No tests implemented. The project relies on developer "smoke testing" via the UI.

## Coverage Gaps
1. **Analysis Pipeline (Critical)**: Verification that `llmService` passes correct transitions (Low -> Mid -> High).
2. **GitHub Ingestion (High)**: Handing of edge cases (binary files, truncated trees).
3. **Harmonization Logic (Medium)**: Ensuring conflict detection actually finds known discrepancies.

## Recommended Framework
- **Framework**: Vitest + React Testing Library (for components).
- **Structure**:
    - `/src/__tests__/services/llmService.test.ts`
    - `/src/__tests__/pipeline/agent.test.ts`
    - `/src/__tests__/ui/AddVariants.test.ts`

## Bootstrap Test Case
File: `/src/__tests__/services/llmService.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { runLowLevelExtraction } from '../../services/llmService';

describe('llmService Extraction', () => {
  it('should format extraction prompts correctly', async () => {
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '{"rawFeatures": "test"}' } }]
      })
    });
    
    const result = await runLowLevelExtraction("content", { name: "Test" } as any, { apiKey: "key", provider: "groq" } as any);
    expect(result.rawFeatures).toBe("test");
  });
});
```
