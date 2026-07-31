---
type: proposal
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## Why

grspec UI 能力（知识库搜索、design-system 生成、init、review）与 change 生命周期的整合长期呈「暗线」形态：UI 决策寄生在 `design` instruction enrichment、`design-system/` 子目录、以及 propose 阶段的 auto-persist 上，没有独立的 artifact 阶段。技术设计（`design.md`）与视觉/交互设计混在一起，graph 上无法表达 `design → ui → plan` 的合理顺序，apply 也难以区分「无 UI」「有 UI 但缺项目底座」「UI 就绪」三种状态。

本 change 将 UI 提升为 **spec-driven schema 的正式 artifact**（落地文件 `ui.md`），统一目录命名为 `ui/`（废弃 `design-system/`），并明确 **项目级底座**（`grspec/ui/MASTER.md`，由 `grspec-ui-init` 建立）与 **change 级增量**（`ui/pages/*.md` + `ui.md` 决策摘要）的分层。同步移除 `grspec-ui` hub skill，仅保留最小粒度子命令 skill/slash。

**不保留对旧路径的兼容**：`design-system/`、`grspec/design-system/`、hub `content/ui.md` 一律废弃，按最新架构一次性切换。

**本 change 为 UI workflow 唯一主干**：吸收并 supersede 已实现的 `ui-workflow-concern-hooks` 与 `ui-subcommand-skills` 中与本提案冲突的部分；另两个 change 在本 change archive 时一并归档，不单独 merge 到 main specs。

## What Changes

### Schema version

- `schemas/spec-driven/schema.yaml` 版本 **1 → 2**；冻结副本保留于 `schemas/spec-driven/v1/schema.yaml`
- 描述更新为：`proposal → specs ∥ design → ui → plan`
- **双版本解析**：`grspec status` / `resolveSchema` 按 change 的 `schemaVersion` 选 v1 或 v2 graph（见 design Decision 1b）
  - **v2**（默认）：`grspec new change` 写入 `.grspec.yaml` → `schemaVersion: 2`；graph 含 `ui` artifact
  - **v1**（存量）：无 `schemaVersion` 或 `schemaVersion: 1` → 四 artifact graph，**不要求** `ui.md`
- **路径无兼容**：v1/v2 均只发现 `grspec/ui/` 与 `change/ui/`；**不**回读 `design-system/`。v1 存量 change 升级到 v2：手动添加 `ui.md` + 将 `schemaVersion` 设为 `2`（或 archive 后重建）
- `grspec status --json` 暴露 `schemaVersion` 字段

### Artifact graph

- 插入 **`ui` artifact**（`generates: ui.md`），`requires: [design]`
- `plan.requires` 扩展为 `[specs, design, ui]`
- `specs` 与 `design` 仍并行依赖 `proposal`（不变）
- 新增 `schemas/spec-driven/templates/ui.md` artifact 模板（与 hub skill 的 `content/ui.md` **不同文件、不同职责**）
- `instruction-loader.ts` 的 `ARTIFACT_TYPE_MAP` 增加 `ui: 'ui'`

### UI 目录与分层（方案 A）

| 层级 | 路径 | 创建方式 | 内容 |
|------|------|----------|------|
| 项目底座 | `grspec/ui/MASTER.md`（**扁平路径，无 slug 子目录**） | `grspec ui init` / `grspec-ui-init` | 全局风格唯一真相源 |
| 项目公共页 | `grspec/ui/pages/*.md` | init 或手动 | 可选跨 change 壳层 |
| change 决策 | `grspec/changes/<name>/ui.md` | ui artifact 阶段 | scope、Status、偏离说明 |
| change 页面 | `grspec/changes/<name>/ui/pages/*.md` | `grspec ui design-system --persist` | 功能/页面 override；**禁止** change 级 `MASTER.md` |

`grspec ui design-system --persist` 语义收紧：

- change 上下文：仅写 `ui/pages/<page>.md`，**永不**写 change 级 `MASTER.md`
- `persist.ts` 重写为 page-only 模式（非简单路径替换）

### ui.md 四态（软门控）

**Artifact 完成判定**（仅 v2 graph）：`ui.md` 文件存在即 artifact `ui` = done（不解析 Status 正文）。

**Status 语义**（`## Status` 节首行，机器可读值 `na` | `blocked` | `done` | `unknown`）：

| Status | 条件 | 必填节 | `ui/pages/` | 挡 plan? | apply UI 任务 |
|--------|------|--------|-------------|----------|----------------|
| `na` | 无 UI surface | Scope + Rationale | 不要求 | 否 | 不应存在 |
| `blocked` | 有 UI，无 `grspec/ui/MASTER.md` | Scope + Required before apply | 可选 provisional | 否 | 不得标 complete |
| `done` | 有 UI + `grspec/ui/MASTER.md` 存在 | Scope + Key Decisions | **可选**（小组件改动可无 pages） | 否 | 正常 + review |
| `unknown` | 缺 `## Status` 或无法解析 | — | — | 否 | **同 blocked**（保守门禁） |

**`done` 精确定义**：`grspec/ui/MASTER.md` 存在 + `ui.md` 中 `Status: done` + `## UI Scope` 非空。**不强制** `ui/pages/` 存在。

### Status 解析与下游消费

- CLI 提供共享函数 `parseUiArtifactStatus(uiMdPath)`（`src/core/ui/ui-artifact.ts`），供 `instructions apply`、`verify`、tests 共用 — **禁止** template 与 CLI 各写一套解析逻辑
- **`grspec instructions apply --json`** 扩展字段（v2 change 且 `ui.md` 存在时）：
  - `schemaVersion: number`
  - `uiArtifactStatus: 'na' | 'blocked' | 'done' | 'unknown'`
  - `uiFoundationReady: boolean` — `true` 当且仅当 `grspec/ui/MASTER.md` 存在
  - `contextFiles.ui: string[]` — 发现路径列表（见 design Decision 6）
- **优先级**：`ui.md` Status **高于** `.grspec.yaml` 的 `ui.detected`
  - `na` → 清除或忽略 `ui.detected`；不触发 UI review 门禁
  - `blocked` / `done` / `unknown` → apply 门禁以 Status 为准（`unknown` 视同 `blocked`）
- **v1 fallback**：无 `ui.md`（v1 graph）时，`effectiveUiActive` 取自 `ui.detected` / `ui-detected` dual-read
- ui artifact 阶段在写 `na` 时 **SHALL** 将 metadata 更新为 `ui.detected: false`（或移除 `ui` 块）

### Unblocking（`blocked` → `done`）

init **不是** graph 节点。状态迁移契约：

1. 用户在任意时刻运行 `/grsx-ui-init` → 创建 `grspec/ui/MASTER.md`
2. **继续 change**（`grspec-continue-change`）或 **重新获取 ui instructions** 时：
   - 若此前 `Status: blocked` 且 MASTER 现已存在 → agent 更新 `ui.md` 为 `done`，补全 Key Decisions
   - 若存在 `provisional: true` 的 pages → re-validate 或 regenerate，移除 provisional frontmatter
3. plan 阶段已写的「待 init」UI 任务可在 `done` 后正常执行

### Metadata：`ui.autoGenerate` 移除

- **REMOVED**：
  - change metadata：`ui.autoGenerate`
  - project/change config：legacy `ui-auto-generate`（`grspec.yaml` 与 `.grspec.yaml`）
  - 所有模板与 `ChangeMetadataSchema` 中的读取逻辑
- propose/ff **仅** detect → `ui: { detected, keywords }`
- 所有 persist / init 触发归 **ui artifact 阶段**（或用户手动子命令），不再由配置门控

### Workflow 行为迁移

| 阶段 | 旧行为（concern-hooks） | 新行为 |
|------|-------------------------|--------|
| propose / ff | detect + auto-persist + `autoGenerate` 门控 | **仅 detect** + metadata |
| design | `enrichDesignInstructionWithUi()` | 移除；纯技术设计 |
| **ui** | — | 决策树 → 写 `ui.md`；可选 `ui/pages/`；orchestrate init / design-system |
| continue | catch-up detect + auto-persist | catch-up detect only；blocked→done 迁移 |
| plan | specs + design | specs + design + **ui.md**（读 Status；UI 任务 **SHALL** 置于 `## UI` 分组） |
| apply | `contextFiles.design-system` + `ui.detected` | `contextFiles.ui` + apply JSON 字段 + CRITICAL rules（Status ≠ `na`） |
| verify | design-system 路径 | foundation coherence + Status 一致性 |
| archive | `ui.detected` 软关卡 | **`effectiveUiActive`** 时软提示先 verify |

### Hub skill 移除（吸收 ui-subcommand-skills）

本 change **取代** `ui-subcommand-skills` 的 hub 部分（该 change 的子命令 templates/parity 测试保留并纳入本 change plan）：

- 删除 `src/core/templates/content/ui.md`（hub 路由表）
- 删除 `getUiSkillTemplate()` / `getGrsxUiCommandTemplate()` 及 `grspec-ui` / `/grsx-ui`
- 保留全部 `grspec-ui-*` 子 skill/slash（init、search、design-system、rules、reference、review、status、detect、install、sync）
- ui artifact schema **instruction** 直接点名子 skill（非 hub）

### Profile 映射（wiki 模式 + 多 skill）

- `ALL_WORKFLOWS` 保留单一 workflow id **`ui`**
- `WORKFLOW_TO_COMMAND_IDS['ui']` — 全部 10 个 UI 子命令 id（同 wiki 多 command）
- 新增 `WORKFLOW_TO_SKILL_DIRS['ui']: readonly string[]` — 全部 `grspec-ui-*` 目录名；`profile-sync-drift` / `update` / `init` 对多 skill workflow 迭代检查（见 design Decision 10b）
- 移除：`WORKFLOW_TO_SKILL_DIR['ui']` 单值映射、`grspec-ui` hub、`ui` command id
- `SKILL_NAMES` / `COMMAND_IDS` / `tool-detection.ts` 同步更新

### Platform export（`grspec ui install`）

- **MODIFIED** `ui-platform-export`：不再导出 monolithic `grspec-ui`
- 默认 bundle：`grspec-ui-init` + `grspec-ui-design-system` + `grspec-ui-review`
- `--all` 导出全部 10 个子 skill
- `assets/ui/templates/*.json` 增加 `skills: string[]`；installer 循环写入

### Provisional pages

`blocked` 状态下若生成 `ui/pages/*.md`，文件 frontmatter **SHALL** 含 `provisional: true`。init 完成后的 unblocking 流程 MUST re-validate 或 regenerate 并移除该标记。

### Supersede：ui-workflow-concern-hooks

本 change 实现时 **撤销/替换** concern-hooks 中以下已落地行为：

| concern-hooks 条目 | 本 change 处置 |
|--------------------|----------------|
| `enrichDesignInstructionWithUi` | **删除** |
| propose/ff auto-persist | **删除** |
| `design-system/` / `grspec/design-system/` discovery | **改为** `ui/` 路径 |
| `ui.autoGenerate` metadata 字段 | **删除** |
| 保留：结构化 `ui` metadata、v1 下 `ui.detected` dual-read、**v2 下 apply CRITICAL rules 内嵌**（`effectiveUiActive`）、continue catch-up **detect**、archive/verify 软关卡（Status 驱动） |

concern-hooks 的 delta specs **不单独 archive**；本 change 的 delta 以 MODIFIED/REMOVED 覆盖 main specs。

## Capabilities

### New Capabilities

- `ui-artifact`: v2 schema `ui` 节点、`ui.md` 模板、四态 Status、`parseUiArtifactStatus`、双版本 graph 解析
- `project-ui-foundation`: `grspec/ui/MASTER.md` 仅 init 创建；status/discovery/init 统一路径
- `change-ui-pages`: change 仅 `ui/pages/`；page-only persist；与项目 MASTER 合并规则
- `ui-artifact-orchestration`: ui 阶段 instruction、unblocking、子 skill 点名
- `ui-subcommand-profile`: hub 移除；`WORKFLOW_TO_SKILL_DIRS` 多 skill 映射
- `archive-ui-soft-gate`: archive 时 `effectiveUiActive` 软提示先 verify

### Modified Capabilities

- `artifact-graph`: v2 五 artifact；v1 冻结副本；`plan.requires` 含 `ui`；`schemaVersion` 解析
- `propose-ui-hook`: 仅 detect；移除 persist 与 `autoGenerate`
- `continue-ui-catchup` (**ADDED**): detect only + blocked→done 提示
- `apply-ui-context`: `contextFiles.ui`；apply JSON 四字段；CRITICAL rules；review 以 `effectiveUiActive` 为准
- `verify-ui-quality`: foundation coherence；Status 与 plan 任务一致性
- `ui-metadata-schema` (**ADDED**): 结构化 `ui` 块、`schemaVersion`、`effectiveUiActive`；不含 `autoGenerate`
- `ui-platform-export`: 多子 skill 导出，废弃 monolithic hub
- `cli-ui-init`: 输出路径 `grspec/ui/`（非 `grspec/design-system/`）

### Removed Capabilities

- `design-phase-ui-hook`
- `design-system-artifact`

## Domain Context

整合触点（目标态）：

```
propose/ff ──detect──▶ .grspec.yaml ui:{detected, keywords}  (no autoGenerate)
continue   ──catch-up detect──▶ metadata; blocked→done if MASTER appears
design     ──pure technical──▶ design.md
ui         ──orchestrate──▶ ui.md [na|blocked|done|unknown] + optional ui/pages/
plan       ◀──parseUiArtifactStatus── specs + design + ui (## UI tasks)
apply      ◀──apply JSON + contextFiles.ui── CRITICAL rules; gate if blocked|unknown
verify     ──coherence + Status vs plan──▶ UI Quality
archive    ──soft gate if effectiveUiActive──▶ suggest verify
```

## Risk Assessment

- **Breaking**：路径、schema v2、hub 移除、`autoGenerate` 移除；不双读 `design-system/`；v1 存量 change 须手动升 v2
- **回归**：graph 新增节点；新 change 须写 `ui.md`（N/A 模板低成本）
- **Supersede**：需回滚 concern-hooks 冲突代码（enrichment、persist 路径）并删除 hub（subcommand-skills 已实现部分）
- **软门控**：plan 不挡 blocked；apply + verify CRITICAL 兜底 UI 任务误完成

## Impact

**Schema**

- `schemas/spec-driven/schema.yaml` — v2，`ui` artifact，`plan.requires`
- `schemas/spec-driven/v1/schema.yaml` — 冻结 v1 四 artifact 副本
- `schemas/spec-driven/templates/ui.md` — N/A / blocked / done 结构；`plan.md` template 增加 `## UI` 分组说明

**CLI / Core**

- `src/core/artifact-graph/instruction-loader.ts` — 删 enrichment；`ARTIFACT_TYPE_MAP` + ui instruction
- `src/core/ui/ui-artifact.ts`（新）— `parseUiArtifactStatus`
- `src/core/ui/persist.ts` — page-only；`ui/pages/`
- `src/core/ui/design-system-context.ts` → `ui-context.ts` — `grspec/ui/`、`change/ui/`
- `src/core/ui/init.ts`、`status.ts` — `grspec/ui/`
- `src/core/artifact-graph/types.ts` — 移除 `ui.autoGenerate`
- `src/commands/workflow/instructions.ts` — `contextFiles.ui`、Status、review 条件
- `src/commands/ui.ts` — 路径与 help 文本
- `src/core/shared/skill-generation.ts`、`tool-detection.ts`、`profile-sync-drift.ts`、`init.ts`、`update.ts` — hub 移除；`WORKFLOW_TO_SKILL_DIRS` 多 skill 映射
- `src/core/artifact-graph/resolver.ts` — 按 `schemaVersion` 加载 v1/v2
- `src/core/ui/installer.ts`、`assets/ui/templates/*.json` — 多子 skill 导出

**Templates**

- `propose.md`、`ff-change.md`、`continue-change.md` — 删 persist / autoGenerate
- `apply-change.md`、`verify-change.md`、`archive-change.md` — Status 驱动
- `onboard.md` — 目录说明改为 `ui.md` + `grspec/ui/`
- `propose.ts` / skills — artifact 列表含 `ui`（非三件套）
- 删除 `content/ui.md`（hub）

**Docs / misc**

- `src/core/agents-md/generator.ts` — workflow 字符串含 `ui` 阶段
- `src/core/wiki.ts` — 可选 ingest `ui.md`（follow-up，非 blocking）

**Sibling changes（归档策略）**

- `ui-workflow-concern-hooks` — superseded；delta 合并入本 change 后 **chore archive 一并删除**
- `ui-subcommand-skills` — 子命令部分保留；hub 部分由本 change 删除；**chore archive 一并删除**

**Specs (delta)**

- New: `ui-artifact`, `project-ui-foundation`, `change-ui-pages`, `ui-artifact-orchestration`, `ui-metadata-schema`, `continue-ui-catchup`, `ui-subcommand-profile`, `archive-ui-soft-gate`
- Modified: `artifact-graph`, `propose-ui-hook`, `apply-ui-context`, `verify-ui-quality`, `ui-platform-export`, `cli-ui-init`
- Removed: `design-phase-ui-hook`, `design-system-artifact`

**Tests**

- `test/core/artifact-graph/` — v2 order、ui completion、Status parser
- `test/core/ui/` — persist page-only、discovery、`grspec/ui/`
- `test/core/templates/` — hub 移除、六 workflow UI 步骤、parity hashes
- 批量替换 `design-system` fixtures → `ui`
