---
type: proposal
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## Why

grspec UI 已具备成熟的知识库与 CLI 能力，但与核心 workflow（propose → apply → verify → archive）的整合曾呈「暗线」状态：元数据格式分裂、项目级与 change 级设计系统无继承、模板与 commands 漂移。本 change 在模板层对齐六条 workflow 路径，并在 CLI 层实现结构化 `ui` metadata 双读、design-system 继承链、以及 apply/design instruction 注入。

## What Changes

- **统一 UI 元数据模型**：将 `.grspec.yaml` 中的 `ui-detected: true` 升级为结构化 `ui: { detected, keywords, autoGenerate }`，CLI 读写时向后兼容旧字段
- **设计系统继承链**：apply 阶段 `contextFiles` 发现逻辑扩展为 change 级 `design-system/` 优先，fallback 到项目级 `grspec/design-system/*/MASTER.md`
- **Workflow 全路径 hooks**：
  - `continue` 路径增加 catch-up UI detection（proposal 已完成但无 ui metadata 时补跑）
  - `apply` 的 UI review 触发条件从「仅有 design-system」改为「`ui.detected` 或有 design-system」
  - `archive` 增加 UI 软关卡（`ui.detected` 时提示先 verify）
- **模板单一真相源**：修复 `.cursor/commands/grsx-apply.md` 与 `grsx-verify.md` 与 content templates / skills 的 UI 步骤漂移；建立 commands 与 content templates 同步机制或 CI 检查
- **内嵌信息优先**：apply instructions 在 `ui.detected` 时内嵌 CRITICAL 规则（已有部分实现），并保留 keywords 供后续 change 消费（本 change 不实现 keyword→rules 筛选）

## Capabilities

### New Capabilities

- `ui-metadata-schema`: 结构化 `ui` 块在 change metadata 中的定义、解析、向后兼容与下游消费契约
- `design-system-inheritance`: apply/design 阶段从项目级设计系统 fallback 继承的发现与 contextFiles 标注规则
- `workflow-template-sync`: content templates 与 deployed commands/skills 之间 UI 相关步骤的一致性保障
- `continue-ui-catchup`: continue 工作流在 proposal 完成后补跑 UI detection 并写入 metadata 的行为契约

### Modified Capabilities

- `propose-ui-hook`: metadata 写入格式从 `ui-detected: boolean` 改为 `ui: { detected, keywords }`；keywords 持久化供下游使用
- `apply-ui-context`: 继承链发现、review 触发条件扩展（`ui.detected` 无 design-system 时也强制 review）
- `design-system-artifact`: 补充项目级设计系统与 change 级 override 的层级关系与发现优先级
- `verify-ui-quality`: 明确 commands 与 skills 均须包含 UI Quality 步骤；与 archive 软关卡的衔接
- `design-phase-ui-hook`: design enrichment 引用继承链（项目 MASTER + change override）

## Domain Context

本 change 横跨以下 bounded contexts（见 `grspec/domain-model.md`）：

- **Artifact Workflow** — change 生命周期各阶段的 UI concern hook 触发与 metadata 消费
- **Template System** — content templates、workflows/*.ts、deployed skills/commands 的一致性
- **CLI Interface** — `instructions apply`、`ui detect`、metadata 解析
- **UI Intelligence**（项目扩展上下文）— 设计系统生成、rules 内嵌、review 门禁

整合触点：

```
propose/ff ──detect──▶ .grspec.yaml ui:{}
continue   ──catch-up▶ .grspec.yaml ui:{}
design     ◀──enrich── proposal + design-system (inheritance)
apply      ◀──context── design-system + CRITICAL rules + review gate
verify     ──review──▶ UI Quality dimension
archive    ──soft gate──▶ suggest verify when ui.detected
```

## Risk Assessment

- **影响范围**：`src/commands/workflow/instructions.ts`、`src/utils/change-metadata.ts`、`src/core/artifact-graph/instruction-loader.ts`、6 个 content templates、对应 commands/skills、若干集成测试。不涉及 artifact graph schema 变更。
- **回归风险**：中等偏低 — 所有 UI 整合均为条件触发；非 UI change 行为应保持不变。metadata 双读（`ui-detected` + `ui.detected`）过渡期需测试覆盖。
- **性能**：`grspec ui detect` 为本地关键词匹配，开销可忽略；项目级 design-system 扫描仅增加一次目录遍历。
- **协调风险**：`ui-workflow-fusion` 已部分落地（skills 有 UI 步骤），本 change 是深化而非重做；需避免与已归档 spec 的 `ui-detected` 表述冲突，通过 MODIFIED delta 明确迁移路径。
- **Breaking**：无硬性 breaking；旧 `ui-detected: true` 继续被读取。新 change 推荐使用 `ui` 块。

## Impact

**CLI / Core**

- `src/utils/change-metadata.ts` — 解析 `ui` 结构化块，兼容 `ui-detected`
- `src/commands/workflow/instructions.ts` — 继承链 contextFiles、review 触发逻辑
- `src/core/artifact-graph/instruction-loader.ts` — design enrichment 引用项目级 MASTER
- `test/core/ui/workflow-integration.test.ts` — 继承链与 metadata 新格式测试

**Templates**

- `src/core/templates/content/propose.md` — metadata 写入格式更新
- `src/core/templates/content/ff-change.md` — 同上
- `src/core/templates/content/apply-change.md` — review 触发条件扩展
- `src/core/templates/content/continue-change.md` — catch-up detect 步骤（新建或更新）
- `src/core/templates/content/verify-change.md` — 确认 UI Quality 步骤完整
- `src/core/templates/content/archive-change.md` — archive UI 软关卡
- `src/core/templates/workflows/*.ts` — 与 content templates 对齐

**Deployed artifacts**

- `.cursor/skills/grspec-*` — 从 templates 重新生成或手动同步
- `.cursor/commands/grsx-propose.md`、`grsx-ff.md`、`grsx-apply.md`、`grsx-verify.md`、`grsx-continue.md`、`grsx-archive.md` — 补齐 UI 步骤

**Specs (delta)**

- `grspec/changes/ui-workflow-concern-hooks/specs/` — 4 个新 capability + 5 个 modified capability delta specs
