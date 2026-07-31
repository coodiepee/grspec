---
type: design
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## Context

grspec UI 子系统（BM25 搜索、design-system 生成、`grspec ui init`、review）与 change 生命周期的整合经历三个阶段：

1. **ui-workflow-fusion** — workflow templates 写入 UI 步骤，但无正式 artifact
2. **ui-workflow-concern-hooks**（已落地）— 结构化 `ui` metadata、apply `contextFiles`、design instruction enrichment、`design-system/` 目录约定
3. **ui-subcommand-skills**（已落地）— 子命令 skill/slash 与 content 对齐，但仍保留 `grspec-ui` hub

本 design 在 **不兼容旧路径** 前提下，将 UI 提升为 **spec-driven v2** 的正式 artifact（`ui.md`），统一目录为 `grspec/ui/`（项目）与 `change/ui/`（增量），并 supersede concern-hooks 的暗线机制（design enrichment、propose auto-persist、`design-system/`）及 subcommand-skills 的 hub。

**当前痛点**：

- `design.md` 与 UI token/页面 spec 混写，review 难以定位视觉约束
- `detectCompleted` 无法表达「有 UI 意图但缺项目底座」
- `design-system/`、`grspec/design-system/`、`projectRoot/design-system/` 三套路径并存
- hub `grspec-ui` 与子命令 skill 双轨路由

## Goals / Non-Goals

**Goals:**

- spec-driven schema **v2**：`proposal → specs ∥ design → ui → plan`
- 项目底座 `grspec/ui/MASTER.md`（仅 init）+ change `ui.md` + 可选 `ui/pages/`
- `ui.md` 四态（`na` | `blocked` | `done` | `unknown`）与共享 parser `parseUiArtifactStatus`
- 软门控：plan 不等待 init；apply 对 UI 任务硬门禁
- CLI `contextFiles.ui` 替代 `design-system`；Status 优先于 `ui.detected`
- 移除 hub、`ui.autoGenerate`、design enrichment、propose persist
- Profile `ui` workflow 采用 wiki 式多 skill/command 映射
- 吸收 sibling changes，单一主干实现后一并 archive

**Non-Goals:**

- 旧 `design-system/` 路径双读或迁移工具（v1 graph 存量 change 须手动升 v2 + 补 `ui.md`）
- 将 init 注册为 graph artifact 节点
- verify 语义化 UX 审计（仍用 `grspec ui review` 静态分析）
- 通用 `concerns: [ui, i18n]` 抽象
- archive 时自动 promote `ui/pages/` 到项目级（仅软提示）
- wiki ingest `ui.md`（follow-up）
- 旧 active change 自动升级到 schema v2

## Decisions

### Decision 1: spec-driven schema v2 with `ui` artifact

**Choice**: Bump `schemas/spec-driven/schema.yaml` to `version: 2`. Add artifact:

```yaml
- id: ui
  generates: ui.md
  requires: [design]
  template: ui.md
  instruction: |
    # (orchestration — see Decision 4)
```

Update `plan.requires` to `[specs, design, ui]`.

**Rationale**: Formal graph node makes `grspec status` / `grspec instructions ui` first-class; plan 显式依赖 UI 决策文件。

**Alternatives considered**:

- Optional `ui` artifact（plan 不 requires）— rejected；每个 change 应用 N/A 模板成本极低，显式依赖更简单
- 条件 graph 边（仅 `ui.detected` 时 requires ui）— rejected；artifact graph 引擎不支持条件依赖

### Decision 1b: Dual schema resolution (v1 frozen + v2 default)

**Choice**:

- Ship frozen `schemas/spec-driven/v1/schema.yaml` (4 artifacts, current v1 content)
- Active `schemas/spec-driven/schema.yaml` becomes v2 (5 artifacts)
- `.grspec.yaml` field `schemaVersion: 1 | 2` (default **2** for `grspec new change`)
- Changes without `schemaVersion` → treat as **1** (in-flight compatibility for graph only)
- `resolveSchema(changeDir)` selects v1 or v2 YAML by version
- `grspec status --json` includes `schemaVersion`

**UI paths**: v1 and v2 both use **only** `grspec/ui/` and `change/ui/` for discovery — **no** `design-system/` fallback. v1 changes without `ui.md` use metadata-only UI gates until upgraded.

**Upgrade path**: Add `ui.md` + set `schemaVersion: 2` + re-run continue/ff for plan dependency.

**Rationale**: Separates graph evolution from breaking in-flight changes that lack `ui.md`, without maintaining legacy directory names.

### Decision 2: Unified `ui/` directory layout (scheme A)

**Choice**:

| Scope | Path | MASTER? |
|-------|------|---------|
| Project | `grspec/ui/MASTER.md` | Yes — **only** here |
| Project pages | `grspec/ui/pages/*.md` | No |
| Change decision | `grspec/changes/<name>/ui.md` | N/A (artifact) |
| Change pages | `grspec/changes/<name>/ui/pages/*.md` | **Forbidden** |

`grspec ui init` SHALL persist **only** to flat `grspec/ui/MASTER.md` (no `<slug>/` subdirectory). Optional `grspec/ui/RULES-CHECKLIST.md` alongside.

**Rationale**: 方案 A 避免 change 级 MASTER 与项目品牌 drift。扁平项目路径消除 `detectDesignSystem` slug 歧义。

**Alternatives considered**:

- Keep slug subdir `grspec/ui/<project-slug>/` — rejected；单项目单 MASTER 足够，status/discovery 更简单
- Change-level MASTER for experiments — rejected；偏离须在 `ui.md` Key Decisions 说明，不另建 MASTER 文件

### Decision 3: `ui.md` four states and artifact completion split

**Choice**:

- **Graph completion** (v2 only): `ui.md` file exists → artifact `ui` = done (via `detectCompleted`)
- **Workflow semantics**: `## Status` first line drives apply/verify/archive gates

Parser contract (`src/core/ui/ui-artifact.ts`):

```typescript
type UiArtifactStatus = 'na' | 'blocked' | 'done' | 'unknown';

function parseUiArtifactStatus(uiMdPath: string): UiArtifactStatus;
// Reads ## Status section; first line matching /^(na|blocked|done)\s*$/i
// Missing section or unreadable file → 'unknown'

function isUiFoundationReady(projectRoot: string): boolean;
// true iff grspec/ui/MASTER.md exists
```

| Status | MASTER required? | `ui/pages/` | Metadata | Apply UI gate |
|--------|------------------|-------------|----------|---------------|
| `na` | No | No | SHALL clear `ui.detected` | No UI tasks |
| `blocked` | Missing | Optional provisional | may be true | Block complete |
| `done` | Present | Optional | should be true | Normal + review |
| `unknown` | — | — | — | **Same as blocked** |

**`done` definition**: `isUiFoundationReady()` AND `Status: done` AND non-empty `## UI Scope`. Pages optional.

**Rationale**: `unknown` catches malformed artifacts; conservative gate prevents silent skip.

### Decision 4: ui artifact orchestration instruction

**Choice**: Schema `ui` artifact instruction SHALL encode this decision tree (agent-facing):

```
1. Read proposal.md, design.md, .grspec.yaml ui metadata
2. Decide UI surface:
   - No screens/components/layout work → write ui.md Status: na; fix metadata
3. If UI surface:
   a. grspec ui status --json (or check grspec/ui/MASTER.md)
   b. If no MASTER:
      - Write ui.md Status: blocked, Scope, Required before apply
      - Suggest /grsx-ui-init (do NOT auto-run in ff without user)
      - MAY generate provisional ui/pages/ via grspec-ui-design-system
   c. If MASTER exists:
      - Write ui.md Status: done, Scope, Key Decisions
      - For new pages: grspec ui design-system "<query>" --persist -o <changeDir>/ui
      - Reference grspec-ui-reference for token detail
4. Never write change-level MASTER.md
```

Sub-skills named explicitly: `grspec-ui-init`, `grspec-ui-design-system`, `grspec-ui-reference`, `grspec-ui-review` — no hub.

**Rationale**: Single orchestration home replaces design enrichment + propose persist.

### Decision 5: Unblocking (`blocked` → `done`)

**Choice**:

```
User runs /grsx-ui-init  →  grspec/ui/MASTER.md created
        │
        ▼
grspec-continue-change OR grspec instructions ui
        │
        ▼
Agent detects: parseUiArtifactStatus === 'blocked' && MASTER exists
        │
        ▼
Update ui.md → Status: done; fill Key Decisions
Re-validate or regenerate ui/pages/* with provisional: true
        │
        ▼
Plan UI tasks (already written) become actionable in apply
```

`continue-change.md` SHALL add step after catch-up detect:

> If `ui.md` exists with `Status: blocked` and `grspec/ui/MASTER.md` now exists, prompt to refresh ui artifact (update to `done`).

**Rationale**: init 非 graph 节点；continue 是自然的「环境变化后补全 artifact」入口。

### Decision 6: `contextFiles.ui` discovery and merge

**Choice**: In `generateApplyInstructions`, after schema artifact files, discover UI context:

```typescript
// Priority for apply context (all under contextFiles['ui']):
const uiFiles: string[] = [];

// 1. Always include change ui.md if exists
if (exists(changeDir/ui.md)) uiFiles.push(...);

// 2. Project foundation
const projectMaster = join(projectRoot, 'grspec/ui/MASTER.md');
if (exists(projectMaster)) uiFiles.push(projectMaster);
// + grspec/ui/pages/*.md if any

// 3. Change page overrides
collectMdFiles(join(changeDir, 'ui/pages')) → uiFiles

// DO NOT include change-level MASTER (forbidden)
```

Instruction text SHALL include via CLI (templates read JSON only):

```json
{
  "schemaVersion": 2,
  "uiArtifactStatus": "blocked",
  "uiFoundationReady": false,
  "contextFiles": { "ui": ["..."] }
}
```

- `uiFoundationReady` := `isUiFoundationReady(projectRoot)` — independent of `Status: done` (agent may forget to update ui.md after init)
- `effectiveUiActive` := v2 with `ui.md` ? `uiArtifactStatus !== 'na'` : metadata dual-read (`ui.detected` || `ui-detected`)

**Apply review gate** (`grspec ui review`) when `effectiveUiActive`.

**UI task complete gate**: SHALL NOT mark complete when (`uiArtifactStatus === 'blocked'` OR `uiArtifactStatus === 'unknown'`) AND task is under plan `## UI` section.

**Plan convention**: v2 `plan` schema instruction SHALL require UI-related tasks under `## UI` heading for gate detection.

**Rationale**: Single discovery module replaces `design-system-context.ts`. Status in JSON prevents template/CLI drift.

**Alternatives considered**:

- Merge project + change into virtual MASTER — rejected；方案 A 禁止 change MASTER
- Separate `contextFiles` keys — rejected；one `ui` key matches artifact naming

### Decision 7: Page-only `persistDesignSystem` rewrite

**Choice**: Split persist into two functions:

| Function | Caller | Output |
|----------|--------|--------|
| `persistProjectFoundation(ds, projectRoot)` | `grspec ui init` | `grspec/ui/MASTER.md` + optional `RULES-CHECKLIST.md` |
| `persistChangePage(ds, changeUiDir, pageName)` | `grspec ui design-system --persist` | `changeUiDir/pages/<page>.md` only |

`grspec ui design-system --persist` SHALL NOT call `persistProjectFoundation`. If `--persist` without project MASTER, still write page file but ui.md should be `blocked`.

Provisional page frontmatter:

```yaml
---
provisional: true
change: <name>
---
```

**Rationale**: 方案 A 需要结构性拆分，非路径 rename。

### Decision 8: Remove `ui.autoGenerate` and propose persist

**Choice**:

- Remove `autoGenerate` from `ChangeMetadataSchema`
- Remove reads of legacy `ui-auto-generate` from project `grspec.yaml` and change `.grspec.yaml`
- propose/ff step 6: **detect + metadata only**
- Remove `enrichDesignInstructionWithUi` entirely

**Rationale**: Generation timing belongs in ui artifact; nested opt-out added complexity without v2 model.

### Decision 9: Metadata priority — `ui.md` over `ui.detected`

**Choice**:

```
// v2 change with ui.md:
effectiveUiActive = parseUiArtifactStatus(ui.md) !== 'na'

// v1 change OR v2 without ui.md (should not happen on v2 graph):
effectiveUiActive = ui.detected === true || ui-detected === true
```

When `ui.md` Status `na`: metadata SHOULD be cleared; `ui.detected` ignored for gates.

**Rationale**: Fixes false-positive detect; v1 graph retains dual-read until manual upgrade.

### Decision 10: Profile mapping (wiki commands + multi-skill dirs)

**Choice**:

```typescript
WORKFLOW_TO_COMMAND_IDS['ui'] = [
  'ui-init', 'ui-search', 'ui-design-system', 'ui-rules', 'ui-reference',
  'ui-review', 'ui-status', 'ui-detect', 'ui-install', 'ui-sync',
];

WORKFLOW_TO_SKILL_DIRS: Partial<Record<WorkflowId, readonly string[]>> = {
  ui: UI_SUBCOMMAND_SKILL_DIR_NAMES, // all 10 grspec-ui-* dirs
};
```

Remove: `grspec-ui` skill, `grsx-ui` command, `WORKFLOW_TO_SKILL_DIR['ui']`, hub `content/ui.md`.

`getSkillTemplates({ workflowFilter: ['ui'] })` returns all entries where `workflowId === 'ui'`.

### Decision 10b: Profile drift for multi-skill workflows

**Choice**: Refactor `profile-sync-drift.ts`, `update.ts`, `init.ts`:

- For workflows in `WORKFLOW_TO_SKILL_DIRS`, iterate **every** skill dir when checking install/drift/removal
- For workflows only in `WORKFLOW_TO_SKILL_DIR` (1:1), keep current logic
- `migration.ts` uses same helper: `getSkillDirsForWorkflow(workflowId)`

**Rationale**: `Record<WorkflowId, string>` cannot map `ui` → 10 dirs; explicit multi-skill table avoids TypeScript breakage and matches install intent.

### Decision 11: Platform export bundle

**Choice**: `grspec ui install --platform <name>` exports **bundle** of three skills by default:

- `grspec-ui-init`
- `grspec-ui-design-system`
- `grspec-ui-review`

`assets/ui/templates/*.json` gain `skills: string[]` array; installer loops. `--all` flag exports full 10 sub-skills.

**Rationale**: External platforms need actionable subset without monolithic hub.

### Decision 12: Supersede sibling changes

**Choice**:

| Change | Action |
|--------|--------|
| `ui-workflow-concern-hooks` | Revert conflicting code paths; merge retained deltas into this change's specs; archive together |
| `ui-subcommand-skills` | Keep subcommand templates/tests; delete hub in this change; archive together |

Do NOT archive sibling delta specs to main separately.

**Rationale**: Avoid conflicting main spec truths and duplicate PR work.

### Decision 13: Archive and verify gates

**Choice**:

- **Archive soft gate**: if `effectiveUiActive`, suggest `/grsx:verify` before archive (non-blocking)
- **Verify foundation coherence**: if Status `done` but `!uiFoundationReady` → CRITICAL; if Status `blocked|unknown` but all `## UI` plan tasks `[x]` → CRITICAL
- **Verify provisional**: any `ui/pages/*.md` with `provisional: true` when Status `done` → WARNING

### Decision 14: Retain apply CRITICAL rules embedding (from concern-hooks)

**Choice**: When `effectiveUiActive` (Decision 9), `generateApplyInstructions` SHALL continue embedding inline CRITICAL UX rules in `instruction` text — same behavior as concern-hooks, keyed on `effectiveUiActive` instead of raw `ui-detected` only.

When `effectiveUiActive` is false, no CRITICAL block.

**Rationale**: Preserves proven apply-phase behavior; only the activation predicate changes to respect `ui.md` Status on v2 changes.

## ui.md Template Structure

Artifact template `schemas/spec-driven/templates/ui.md` provides section scaffolding; agent fills per status.

**N/A minimal example:**

```markdown
## UI Scope
No UI surface.

## Status
na

## Rationale
Backend-only API change; no screens or client components affected.
```

**Blocked example:**

```markdown
## UI Scope
Billing settings page and payment method modal.

## Status
blocked

## Required before apply
Create project foundation: `/grsx-ui-init` → `grspec/ui/MASTER.md`

## Provisional assets
- ui/pages/billing-settings.md (provisional — re-validate after init)
```

**Done example:**

```markdown
## UI Scope
Billing settings page; reuses project shell.

## Status
done

## Key Decisions
- SHALL use project primary token `--color-primary` for CTA buttons
- MAY add page-specific density in ui/pages/billing-settings.md
- SHALL NOT introduce new global font pairing (inherits MASTER)

## Assets
- Project: grspec/ui/MASTER.md
- Change: ui/pages/billing-settings.md
```

**Unknown** (malformed — agent MUST fix before apply):

```markdown
## UI Scope
Billing settings page.

## Status

(missing value — invalid)
```

Parser returns `unknown`; apply treats as `blocked` until fixed.

## Schema Changes

| File | Change |
|------|--------|
| `schemas/spec-driven/schema.yaml` | `version: 2`; add `ui` artifact; `plan.requires` |
| `schemas/spec-driven/v1/schema.yaml` | Frozen v1 copy (4 artifacts) |
| `schemas/spec-driven/templates/ui.md` | New artifact template |
| `schemas/spec-driven/templates/plan.md` | Note: UI tasks under `## UI` |
| `src/core/artifact-graph/types.ts` | Remove `ui.autoGenerate`; optional `schemaVersion` on change metadata |
| `src/core/artifact-graph/resolver.ts` | Load v1 or v2 by `schemaVersion` |

No codegen / xidl changes.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| `parseUiArtifactStatus` + tests | TDD | `test/core/ui/ui-artifact.test.ts` |
| schema v2 + graph tests | TDD | `test/core/artifact-graph/` |
| `ui-context.ts` (replace design-system-context) | TDD | discovery paths |
| `persistProjectFoundation` / `persistChangePage` | TDD | page-only split |
| `generateApplyInstructions` ui branch | TDD | `workflow-integration.test.ts` |
| Remove enrichment + autoGenerate | AI+review | instruction-loader, types, templates |
| schema `ui` instruction + template | manual | orchestration text |
| Workflow content templates (6+) | AI+review | propose/ff/continue/apply/verify/archive/onboard |
| Hub removal + `WORKFLOW_TO_SKILL_DIRS` | TDD | profile-sync-drift, update, init, migration |
| Platform installer bundle | TDD | installer.test.ts |
| Parity tests | TDD | refresh hashes; remove hub assertions |
| Sibling change cleanup | manual | archive concern-hooks + subcommand-skills with this change |

## Risks / Trade-offs

- **[Risk] v1/v2 schema coexistence confusion** → `schemaVersion` in status JSON + onboard docs; v1 frozen YAML
- **[Risk] v1 change loses design-system paths** → documented upgrade: add `ui.md` + `schemaVersion: 2`; no path fallback
- **[Risk] `unknown` Status blocks UI work** → ui template mandates `## Status`; verify flags missing section
- **[Risk] blocked + provisional pages mislead implementers** → `uiFoundationReady` in apply JSON + CRITICAL instruction
- **[Risk] Large PR (supersede two siblings)** → ordered plan groups; single archive at end
- **[Risk] Multi-skill drift checks** → `getSkillDirsForWorkflow()` shared helper (Decision 10b)
- **[Risk] External platforms expect single skill** → default bundle of 3; `--all` for full set
- **[Risk] Flat `grspec/ui/MASTER.md` vs monorepos** → Non-Goal; one brand per project root

## Migration Plan

1. Add `schemas/spec-driven/v1/` frozen copy; bump main schema to v2
2. Land parser + `ui-context.ts` + `WORKFLOW_TO_SKILL_DIRS` helper — tests green
3. Rewire `instructions.ts` (apply JSON fields + CRITICAL rules predicate) — tests green
4. Update workflow templates + remove hub — parity tests
5. Update CLI ui commands paths — fixture sweep `design-system` → `ui`
6. Archive this change + sibling changes in one chore commit series
7. **No** automated migration of on-disk `design-system/` dirs; v1 changes upgrade manually

## Open Questions

- Should `grspec validate change` warn on `Status: done` without MASTER? **Resolved — verify CRITICAL; CLI validate follow-up.**
- Single `grspec/ui/MASTER.md` vs slug subfolder? **Resolved — flat `grspec/ui/MASTER.md`.**
- v1 in-flight changes without `ui.md`? **Resolved — Decision 1b: v1 graph + metadata-only UI until manual upgrade.**
