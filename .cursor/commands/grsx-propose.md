---
name: /grsx-propose
id: grsx-propose
category: Workflow
description: Propose a new change - create it and generate all artifacts in one step
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:
- proposal.md (what & why)
- specs/ (requirements per capability)
- design.md (technical how)
- ui.md (UI scope & status — schema v2)
- plan.md (implementation steps; group UI tasks under ## UI)

When ready to implement, run /grsx:apply

---

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Pre-propose reconnaissance**

   Before creating the change, gather intelligence about parallel work:
   ```bash
   grspec change overlap --json
   grspec activity --hot --json
   ```
   This identifies:
   - Active changes that may overlap with the proposed work
   - Hot files (frequently modified by multiple authors)

   Use this data when writing the proposal to flag coordination risks and inform `touches`.

3. **Create the change directory**
   ```bash
   grspec new change "<name>"
   ```
   This creates a scaffolded change at `grspec/changes/<name>/` with `.grspec.yaml`.

4. **Get the artifact build order**
   ```bash
   grspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies

5. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        grspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `outputPath`: Where to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `grspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

6. **UI detection (after artifact loop)**

   After proposal is created, detect UI content:
   ```bash
   grspec ui detect --change "<name>" --json
   ```
   Parse the JSON result:
   - If `detected: true`:
     - Add to `.grspec.yaml`:
       ```yaml
       ui:
         detected: true
         keywords: [<matched keywords from detect JSON>]
       ```
     - Display summary with matched keywords
   - If `detected: false`: silently continue (no output)

   Do NOT run `grspec ui design-system --persist` or create `ui/pages/` during propose.

7. **Infer touches and update metadata**

   After proposal is created, infer which files will be impacted:
   - Analyze the intent against the codebase structure (directory tree, entry files)
   - Cross-reference with git recon data (hot files, recent activity)
   - Produce a `touches` list: max 8 files, each with `path`, `intent` (verb-first), and `mode` (create/modify/delete)
   - Prefer precision over recall: omit uncertain files rather than include noisy entries
   - Check for overlap with other active changes' `touches` — if found, add a coordination warning to the proposal

   Update `.grspec.yaml` with:
   ```yaml
   touches:
     - path: src/example.ts
       intent: "Add new handler for X"
       mode: modify
   ```

   If the user describes sequencing needs, also add:
   ```yaml
   dependsOn:
     - <other-change-name>
   provides:
     - <capability-marker>
   requires:
     - <capability-marker>
   ```

8. **Show final status**
   ```bash
   grspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- UI detection result (if detected: keywords only — no persist during propose)
- Touches inferred (file paths and intents)
- Any overlap warnings with other active changes
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/grsx:apply` or ask me to implement to start working on the tasks."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `grspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Proposal artifact — required sections**

When creating `proposal.md`, ensure the document includes these sections (merge with the CLI `template` if sections are not already present):

### Domain Context
<!-- Which bounded contexts does this change affect? What core entities are involved? -->

### Risk Assessment
<!-- Impact scope, regression risk, performance implications, coordination with parallel changes -->

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
- Limit touches to 8 files maximum; if more are needed, suggest splitting the change
- If overlap is detected with active changes, surface it prominently in the proposal
