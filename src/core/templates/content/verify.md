Verify that an implementation matches the change artifacts (specs, tasks, design), with evidence from project build/test/lint.

**Input**: Optionally specify a change name (e.g., `grspec` workflow via `/grsx:verify <name>`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

## Iron Law

**Never claim verification passed without evidence.** Assertions without command output are not verification.

---

**Steps**

1. **If no change name provided, prompt for selection**

   Run `grspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show changes that have implementation tasks (tasks artifact exists).
   Include the schema used for each change if available.
   Mark changes with incomplete tasks as "(In Progress)".

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check status to understand the schema**
   ```bash
   grspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifacts exist for this change

3. **Get the change directory and load artifacts**

   ```bash
   grspec instructions apply --change "<name>" --json
   ```

   This returns the change directory and `contextFiles` (artifact ID -> array of concrete file paths). Read all available artifacts from `contextFiles`.

4. **Initialize verification report structure**

   Create a report structure with three dimensions:
   - **Completeness**: Track tasks and spec coverage
   - **Correctness**: Track requirement implementation and scenario coverage
   - **Coherence**: Track design adherence and pattern consistency

   Each dimension can have CRITICAL, WARNING, or SUGGESTION issues.

5. **Verify Completeness**

   **Task Completion**:
   - If `contextFiles.tasks` exists, read every file path in it
   - Parse checkboxes: `- [ ]` (incomplete) vs `- [x]` (complete)
   - Count complete vs total tasks
   - If incomplete tasks exist:
     - Add CRITICAL issue for each incomplete task
     - Recommendation: "Complete task: <description>" or "Mark as done if already implemented"

   **Spec Coverage**:
   - If delta specs exist in `grspec/changes/<name>/specs/`:
     - Extract all requirements (marked with "### Requirement:")
     - For each requirement:
       - Search codebase for keywords related to the requirement
       - Assess if implementation likely exists
     - If requirements appear unimplemented:
       - Add CRITICAL issue: "Requirement not found: <requirement name>"
       - Recommendation: "Implement requirement X: <description>"

6. **Verify Correctness**

   **Requirement Implementation Mapping**:
   - For each requirement from delta specs:
     - Search codebase for implementation evidence
     - If found, note file paths and line ranges
     - Assess if implementation matches requirement intent
     - If divergence detected:
       - Add WARNING: "Implementation may diverge from spec: <details>"
       - Recommendation: "Review <file>:<lines> against requirement X"

   **Scenario Coverage**:
   - For each scenario in delta specs (marked with "#### Scenario:"):
     - Check if conditions are handled in code
     - Check if tests exist covering the scenario
     - If scenario appears uncovered:
       - Add WARNING: "Scenario not covered: <scenario name>"
       - Recommendation: "Add test or implementation for scenario: <description>"

7. **Verify Coherence**

   **Design Adherence**:
   - If `contextFiles.design` exists:
     - Extract key decisions (look for sections like "Decision:", "Approach:", "Architecture:")
     - Verify implementation follows those decisions
     - If contradiction detected:
       - Add WARNING: "Design decision not followed: <decision>"
       - Recommendation: "Update implementation or revise design.md to match reality"
   - If no design.md: Skip design adherence check, note "No design.md to verify against"

   **Code Pattern Consistency**:
   - Review new code for consistency with project patterns
   - Check file naming, directory structure, coding style
   - If significant deviations found:
     - Add SUGGESTION: "Code pattern deviation: <details>"
     - Recommendation: "Consider following project pattern: <example>"

8. **Verify UI Quality (conditional)**

   Use apply JSON fields from Step 3 (`effectiveUiActive`, `uiArtifactStatus`, `uiFoundationReady`). When apply JSON is unavailable, derive the same values from `ui.md` Status and whether `grspec/ui/MASTER.md` exists.

   Only run this step if:
   - `effectiveUiActive` is true (`ui.md` Status ≠ `na`, or apply JSON `effectiveUiActive: true`), OR
   - The change's `touches` include files with UI extensions (`.tsx`, `.jsx`, `.css`, `.scss`, `.vue`, `.svelte`)

   If neither condition is met, skip and note "UI Quality: skipped (UI not active for this change)".

   **Foundation coherence:**
   - When `uiArtifactStatus` is `done` and `uiFoundationReady` is `false`:
     - Add CRITICAL: "UI foundation missing: ui.md Status is done but grspec/ui/MASTER.md does not exist"
     - Recommendation: "Run `/grsx-ui-init` or set ui.md Status to blocked until foundation exists"
   - When `uiArtifactStatus` is `blocked` or `unknown`:
     - Parse plan tasks under the `## UI` heading (from `contextFiles.tasks` or plan.md)
     - If every UI task is marked `[x]`:
       - Add CRITICAL: "UI plan inconsistency: ui.md is blocked/unknown but all ## UI tasks are complete"
       - Recommendation: "Complete UI foundation and ui.md Status before marking UI tasks done, or revert task checkboxes"
   - When `uiArtifactStatus` is `done`:
     - Scan change page files under `ui/pages/` (from `contextFiles.ui` or the change directory)
     - If any page has `provisional: true` in YAML frontmatter:
       - Add WARNING: "Provisional UI page overrides need re-validation: <file>"
       - Recommendation: "Regenerate or manually update the page after ui.md unblock"

   **Static Analysis:**
   ```bash
   grspec ui review <changed-file-paths> --json
   ```

   **Design-system tokens (when available):**
   When `grspec/ui/MASTER.md` exists, note in the UI Quality section: "Design-system available for token verification — reference MASTER.md colors, typography, and spacing when assessing findings."

   Map findings to verification severity levels:
   - CRITICAL review findings → CRITICAL verification issues
   - HIGH review findings → WARNING verification issues
   - MEDIUM review findings → SUGGESTION verification issues

   If zero findings: note "UI Quality: ✓ No issues found"

9. **Generate Verification Report**

   **Summary Scorecard**:
   ```
   ## Verification Report: <change-name>

   ### Summary
   | Dimension      | Status           |
   |----------------|------------------|
   | Completeness   | X/Y tasks, N reqs|
   | Correctness    | M/N reqs covered |
   | Coherence      | Followed/Issues  |
   | UI Quality     | N findings / Pass|
   ```

   Note: Include the UI Quality row only when Step 8 ran. Omit it when skipped.

   **Issues by Priority**:

   1. **CRITICAL** (Must fix before archive):
      - Incomplete tasks
      - Missing requirement implementations
      - Each with specific, actionable recommendation

   2. **WARNING** (Should fix):
      - Spec/design divergences
      - Missing scenario coverage
      - Each with specific recommendation

   3. **SUGGESTION** (Nice to fix):
      - Pattern inconsistencies
      - Minor improvements
      - Each with specific recommendation

   **Final Assessment**:
   - If CRITICAL issues: "X critical issue(s) found. Fix before archiving."
   - If only warnings: "No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
   - If all clear: "All checks passed. Ready for archive."

**Verification Heuristics**

- **Completeness**: Focus on objective checklist items (checkboxes, requirements list)
- **Correctness**: Use keyword search, file path analysis, reasonable inference - don't require perfect certainty
- **Coherence**: Look for glaring inconsistencies, don't nitpick style
- **False Positives**: When uncertain, prefer SUGGESTION over WARNING, WARNING over CRITICAL
- **Actionability**: Every issue must have a specific recommendation with file/line references where applicable

**Graceful Degradation**

- If only plan.md exists: verify task completion only, skip spec/design checks
- If tasks + specs exist: verify completeness and correctness, skip design
- If full artifacts: verify all three dimensions
- Always note which checks were skipped and why

**Evidence Gate (build / test / lint)**

Before claiming "ready for archive" or "all checks passed", run and capture output for:

1. **Build** — project build command
2. **Tests** — project test command (scoped per project convention if allowed)
3. **Lint** — project lint command (or integrated substitute)

**Red flags** (do not claim success when): "pretty sure it works", "looked fine in the UI", "small change so skipped suite", "failure is unrelated" without investigation.

If the environment cannot run commands, say so explicitly — do not imply verification.

**Output Format**

Use clear markdown with:
- Table for summary scorecard
- Grouped lists for issues (CRITICAL/WARNING/SUGGESTION)
- Code references in format: `file.ts:123`
- Specific, actionable recommendations
- No vague suggestions like "consider reviewing"
