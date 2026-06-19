# AUDIT

## Security Review
- **Severity: High**
    - **Issue**: Client-side Secret Exposure.
    - **Evidence**: `llmService.ts` takes `apiKey` from `ApiConfig` state and sends it in `Authorization` headers directly to Groq/OpenRouter from the browser.
    - **Impact**: API keys can be captured via browser extensions, network proxy tools, or XSS.
    - **Recommendation**: Implement a server-side proxy route that injects secrets.

- **Severity: Medium**
    - **Issue**: Unsafe Repository Downloader.
    - **Evidence**: `App.tsx` uses `atob()` on GitHub content without validation and limits to 75 files.
    - **Impact**: Large repos result in silently incomplete analysis (Pass 0 Summary will be hallucinated from a subset of files).

## Dependency Review
- **Outcome**: Generally healthy.
- **Conflict**: `@google/genai` is installed but the primary service uses `fetch` to Groq. The Gemini integration was orphaned (deleted).
- **Confidence**: High.

## Performance Review
- **Issue**: Main thread blocking during large repo stringification.
- **Evidence**: `JSON.stringify` on a 75-file map inside `App.tsx`.
- **Risk**: Browser freeze on lower-end devices when processing large source files.

## Observability Review
- **Issue**: Silent Failures in Pipeline.
- **Evidence**: `llmService.ts` catches JSON parse errors but returns `{ raw: content }`, which might break downstream types expecting specific objects.
- **Confidence**: Medium.

## Risk Assessment
- **Context Window Exhaustion**: The pipeline sends massive chunks of JSON in recursive prompts. As the number of variants grows, the comparison prompt (`compareVariants`) will likely exceed context limits (substrings are used but are arbitrary).
