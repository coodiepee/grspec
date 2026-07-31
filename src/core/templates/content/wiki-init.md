Build the entire LLM Wiki from the current codebase.

1. Check if wiki already exists (`grspec wiki status`). If yes, confirm overwrite.
2. **Plan phase**: Read the project's constitution, domain model, and all specs. Identify topics for:
   - `concepts/` — architectural concepts, design patterns, principles
   - `entities/` — one per spec capability (maps to `grspec/specs/<name>/`)
   - `sources/` — key source files or modules
   - `comparisons/` — notable trade-off decisions
3. **Batch build**: For each topic, generate a wiki page with proper frontmatter:
   ```yaml
   ---
   title: "<topic name>"
   type: "<concept|entity|source-summary|comparison>"
   created: "<today>"
   updated: "<today>"
   confidence: "high"
   sources:
     - "<relevant file paths>"
   related:
     - "[[related-topic]]"
   ---
   ```
4. **Finalize**: Generate `index.md`, `log.md`, and `overview.md`.
5. Run `grspec wiki lint --structural` to verify.
