Run structural validation on changes and specs via the grspec CLI.

**Input**: Optionally an item name and/or flags matching the CLI (e.g., `/grsx:validate`, `/grsx:validate --changes`, `/grsx:validate <name>`).

## Purpose

`grspec validate` checks that specs and change deltas are well-formed (headers, scenarios, delta operations). It does **not** assess whether implementation matches artifacts — use `/grsx:verify` / skill `grspec-verify` for that.

## Steps

1. **Choose scope**
   - Prefer explicit user flags/name when provided.
   - Otherwise ask with **AskUserQuestion**: validate all, changes only, specs only, or a named item.

2. **Run the CLI** (pick one):
   ```bash
   grspec validate --all
   grspec validate --changes
   grspec validate --specs
   grspec validate <item-name>
   grspec validate <item-name> --type change|spec
   ```
   Add `--json` when structured output helps; `--strict` when treating warnings as failures.

3. **Report results**
   - Surface errors with remediation from the CLI output.
   - If clean, say so and suggest `/grsx:verify <change>` when the user is checking implementation readiness.

## Guardrails

- Do not invent a `grspec verify` CLI — verification of implementation is the verify skill/slash.
- Prefer CLI output as source of truth; do not re-parse specs by hand unless the CLI fails.
