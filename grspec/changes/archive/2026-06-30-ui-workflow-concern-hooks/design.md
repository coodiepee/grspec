---
type: design
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## Context

`ui-workflow-fusion` 已将 UI 步骤写入 content templates 与 skills，CLI 层实现了 design enrichment、`contextFiles` 发现、以及 `ui-detected: true` 时的 CRITICAL 规则内嵌。

**模板层（本 change 已对齐）**：6 个 content templates、对应 `workflows/*.ts`、deployed commands/skills 已统一为结构化 `ui:` metadata、continue catch-up、apply review 条件、verify UI Quality、archive 软关卡。

**CLI 层（本 change 已实现）**：

- **元数据**：`ChangeMetadataSchema` 支持 `ui: { detected, keywords, autoGenerate }`，`readChangeMetadata` 双读并输出 `uiDetected` / `uiKeywords`
- **设计系统继承**：`generateApplyInstructions` change 级优先，fallback `detectDesignSystem()` 项目 MASTER
- **metadata 消费**：`instructions.ts` 与 `enrichDesignInstructionWithUi` 走统一 UI 状态

本 design 在模板整合已完成的基础上，深化 **Concern Hook 模型** 的 CLI 部分：以 `.grspec.yaml` 为单一真相源，条件触发、非 UI change 零影响。

## Goals / Non-Goals

**Goals:**

- 结构化 `ui` metadata（`detected`、`keywords`、`autoGenerate`），CLI 双读兼容 `ui-detected`
- apply/design 阶段设计系统继承链：change override > project MASTER
- 全路径 hooks：continue catch-up、apply review 条件修正、archive 软关卡
- content templates 为唯一源，commands/skills 与 templates 对齐
- 测试覆盖 metadata 解析、继承链发现、模板一致性

**Non-Goals:**

- 将 `design-system` 注册为 schema artifact（保持文件扫描 + metadata 模式）
- CLI 层在 `grspec new change` 时自动 detect（仍由 agent 按 template 执行）
- verify 阶段引入语义 review（保持 `grspec ui review` 静态分析）
- 通用 `concerns: [ui, i18n, security]` 抽象（仅 UI 有完整 tooling）
- Task-aware per-plan-item 规则匹配（Level 2，留待后续 change）

## Decisions

### Decision 1: Structured `ui` block with backward-compatible read

**Choice**: Extend `ChangeMetadataSchema` with optional `ui` object; readers SHALL treat `ui.detected === true` OR legacy `ui-detected === true` as UI-active.

```yaml
ui:
  detected: true
  keywords: [dashboard, responsive, chart]
  autoGenerate: true   # default true when omitted
```

**Rationale**: Keywords enable future `grspec ui rules --search` filtering without re-scanning proposal. Dual-read avoids breaking existing changes.

**Alternatives considered**:
- Breaking migration to `ui` only — rejected; archive history and open changes may still use `ui-detected`
- Keep boolean only — rejected; loses keywords signal already specified in propose-ui-hook

### Decision 2: Design-system inheritance chain in `generateApplyInstructions`

**Choice**: Discovery order:
1. `<changeDir>/design-system/MASTER.md` → `contextFiles['design-system']` contains only change-level `.md` files
2. Else `grspec/design-system/<slug>/MASTER.md` — prefer path from `detectDesignSystem(projectRoot)` when available; otherwise first valid slug directory with `MASTER.md`
3. When change-level MASTER exists, project-level paths SHALL NOT appear in `contextFiles` (no merge). Design instruction text MAY note that page overrides inherit from project MASTER when only override files exist at change level without a local MASTER

**Rationale**: Projects that ran `grspec ui init` get tokens in apply even when propose didn't generate change-level DS.

**Alternatives considered**:
- Always require change-level generation — rejected; redundant for small UI tweaks on established projects
- Separate `contextFiles` keys (`design-system-change` / `design-system-project`) — rejected; adds agent complexity; instruction text can note source

### Decision 3: Apply review gate keyed on UI concern, not design-system presence

**Choice**: Apply content template SHALL run `grspec ui review` after each task when ANY of:
- `contextFiles` includes `design-system`, OR
- change metadata indicates UI active (`ui.detected` or `ui-detected`)

**Rationale**: CRITICAL rules are embedded when `ui-detected` without design-system; review gate must match rule injection.

### Decision 4: Continue catch-up in content template only

**Choice**: Add step to `content/continue-change.md`: after loading status, if `proposal` is `done` and `.grspec.yaml` has no `ui` block and no `ui-detected`, run `grspec ui detect` and write metadata (same as propose step 6, without auto-generate if `autoGenerate: false`).

**Rationale**: Catches `/grsx:new` + `/grsx:continue` path where propose hook never ran. Agent can summarize for user; no CLI auto-side-effect in `grspec status`.

**Alternatives considered**:
- CLI auto-detect in `grspec instructions design` — rejected for this change; would silently mutate metadata without agent visibility

### Decision 5: Template sync via content templates as source of truth

**Choice**:
- All workflow UI steps live in `src/core/templates/content/*.md`
- `workflows/*.ts` command templates SHALL mirror content templates for apply/verify/continue/propose
- Deployed `.cursor/commands/` updated in same PR as content templates
- Add test in `test/core/templates/` that asserts key UI phrases exist in both content and command outputs (workflow-template-sync)

**Rationale**: Root cause of drift is dual maintenance. Single source + parity test prevents regression.

**Alternatives considered**:
- Generate commands from content at `grspec init` time — larger scope; defer unless parity test proves insufficient

### Decision 6: Archive soft gate via archive skill template

**Choice**: When `ui.detected` or `ui-detected`, archive skill SHALL warn if verify has not been run recently (heuristic: suggest `/grsx:verify` before archive). Non-blocking — user can confirm proceed.

**Rationale**: Closes lifecycle loop without hard-blocking archive (consistent with existing incomplete-task warnings).

### Decision 7: Opt-out via `ui.autoGenerate` nested under `ui` block

**Choice**: Read order for auto-generate suppression:
1. `ui.autoGenerate: false` in change `.grspec.yaml`
2. Legacy `ui-auto-generate: false` in change or project `grspec.yaml` (keep existing)

**Rationale**: Consolidates under `ui` block while preserving project-level opt-out from propose-ui-hook.

## Schema Changes

SKIP — no xidl/protobuf/codegen schema changes. `ChangeMetadataSchema` Zod extension only.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| `ChangeMetadataSchema` + reader | TDD | New `ui` block parsing, dual-read, tests first |
| `generateApplyInstructions` inheritance | TDD | Extend `workflow-integration.test.ts` |
| `enrichDesignInstructionWithUi` | AI+review | Reference project MASTER when change DS absent |
| Content templates (5 files) | AI+review | propose/ff metadata format, continue catch-up, apply review condition |
| `workflows/*.ts` + `.cursor/commands/` | AI+review | Mirror content templates |
| Parity test | TDD | Key UI strings in content vs command templates |
| Deployed skills sync | manual / `grspec init` | Same PR as template updates |

## Risks / Trade-offs

- **[Risk] Metadata dual-read confusion** → Document in design; tests assert both formats produce identical `uiDetected` + `uiKeywords` in parsed metadata
- **[Risk] Project DS wrong slug picked** → Prefer `detectDesignSystem()` path from `grspec ui status`; fallback to first directory with valid `MASTER.md` under `grspec/design-system/`
- **[Risk] Template drift recurs** → Parity test in CI; content template is canonical
- **[Risk] Continue catch-up runs on non-UI proposals** → Same ≥3 keyword threshold as detect.ts; no metadata write when `detected: false`
- **[Risk] Larger apply instructions (CRITICAL rules + project DS paths)** → Acceptable; rules already embedded today; inheritance adds one MASTER path

## Migration Plan

1. Ship CLI metadata + inheritance (backward compatible)
2. Update content templates and regenerate commands/skills
3. Existing changes with `ui-detected: true` continue working without migration
4. New propose/ff flows write `ui:` block; optional follow-up to normalize old changes on touch
5. Rollback: revert template + CLI changes; flat `ui-detected` still supported

## Open Questions

- Should archive hard-block on CRITICAL UI findings from a cached verify report, or remain soft-gate only? **Deferred — soft gate only for this change.**
- Parity test scope: exact string match vs semantic section presence? **Resolved — extend existing `skill-templates-parity.test.ts` function hashes plus targeted UI phrase assertions.**
