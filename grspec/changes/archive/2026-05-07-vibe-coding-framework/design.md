## Context

grspec 当前基于 OpenSpec 的 artifact 工作流（proposal → specs → design → tasks → apply → archive），通过 spec-driven schema 管理变更生命周期。项目已从 OpenSpec fork 并重命名为 grspec。

现状的主要限制：
- 没有领域知识的持久化机制（缺少 constitution / domain model）
- 缺少 plan 阶段，task 粒度偏粗
- 没有执行纪律约束（TDD / verification / debugging / review）
- 没有并行协作能力（subagent / parallel dispatch）

本设计基于 pr.md 中的对比分析和融合方案，将 grspec 升级为 Vibe Coding Framework。

## Goals / Non-Goals

**Goals:**
- 在 `grspec init` 中支持 `--track new-project|existing-project`，生成知识层模板文件
- 扩展 spec-driven schema，新增 plan artifact
- 在 `src/core/templates/workflows/` 中新增执行纪律和协作基础设施的 skill 模板
- 配置文件从 `config.yaml` 升级为 `grspec.yaml`，支持 knowledge/workflow/execution/codegen/collaboration/bootstrap 字段
- 所有新增 skill 通过 `grspec init --tools` 生成到用户项目的 `.cursor/skills/` 目录

**Non-Goals:**
- 不实现 AI 推理能力（grspec 只是脚手架 + 状态机）
- 不实现具体的 codegen 工具链（xidl/protobuf/OpenAPI 由用户项目自备）
- 不实现 workspace 多仓库协调（已有独立的 workspace 命令体系）
- 不实现 Spec-Kit 的线性 phase-gate 流水线（保持 artifact graph 的灵活性）

## Decisions

### D1: 配置文件升级策略

**选择**: `config.yaml` → `grspec.yaml`，直接 breaking

**理由**: 这是 fork 项目，不需要向后兼容。新文件名与项目品牌一致。

**结构设计**:
```yaml
version: "2.0"

# 保留原有字段
schema: spec-driven
context: |
  ...

# 新增：知识层
knowledge:
  constitution: constitution.md
  domain-model: domain-model.md
  specs-dir: specs/

# 新增：工作流
workflow:
  gates:
    proposal-review: true
    design-review: true
    archive-verification: true

# 新增：执行纪律
execution:
  tdd-policy: core-logic       # core-logic | all | none
  review-policy: dual-stage    # dual-stage | quality-only | none
  verification: strict         # strict | relaxed

# 新增：codegen
codegen:
  tool: none                   # stage | protoc | openapi-gen | none
  schema-dir: spec/
  command: make gen

# 新增：协作
collaboration:
  parallel-strategy: bounded-context
  worktree: true
  model-selection: auto

# 新增：bootstrap（新项目专用）
bootstrap:
  completed: false
```

**影响**: `src/core/project-config.ts` 需要支持新文件名和扩展字段。`src/core/config-schema.ts` 需要用 Zod 定义新 schema。

### D2: plan artifact 在 schema 依赖链中的位置

**选择**: `plan.requires = [design, specs]`，`apply.requires = [plan]`（替代原来的 `apply.requires = [tasks]`）

**理由**: pr.md 原始设计将 plan 定位为"细粒度任务分解"，需要 design 的技术方案和 specs 的需求约束才能制定合理计划。

**schema 变更**:
```yaml
artifacts:
  - id: proposal
    requires: []
  - id: specs
    requires: [proposal]
  - id: design
    requires: [proposal]
  - id: plan          # 新增：替代原来的 tasks
    requires: [design, specs]

apply:
  requires: [plan]    # 从 tasks 改为 plan
  tracks: plan.md     # 从 tasks.md 改为 plan.md
```

**注意**: 原有的 `tasks` artifact 被 `plan` 取代。plan.md 的格式保持 checkbox 列表，但每个 task 增加 strategy/bounded-context/verification 标注。

### D3: 知识层模板文件的生成方式

**选择**: 在 `grspec init` 时按 `--track` 参数决定生成内容

- `--track new-project`: 生成完整的 constitution.md + domain-model.md 模板
- `--track existing-project`: 生成带逆向梳理指引的 constitution.md + domain-model.md 骨架
- 无 `--track`（默认）: 保持当前行为，不生成知识层文件

**实现位置**: `src/core/init.ts` 扩展初始化逻辑，新增模板文件到 `src/core/templates/`。

### D4: 执行纪律 skill 的实现方式

**选择**: 内置到模板系统 + 通过 `grspec init --tools` 生成到用户 `.cursor/skills/`

**理由**: 和现有的 workflow skill（propose/apply/archive/explore 等）保持一致的分发机制。

**Skill 列表**:
| Skill ID | 文件 | 触发场景 |
|----------|------|---------|
| `grspec-tdd` | TDD RED-GREEN-REFACTOR | task strategy = TDD |
| `grspec-verify` | verification-before-completion | task 完成 / archive 前 |
| `grspec-debug` | systematic-debugging | 遇到 bug / test failure |
| `grspec-review` | dual-stage code review | 核心逻辑 task 完成 |
| `grspec-parallel` | parallel-dispatch | 独立 task 并行 |
| `grspec-subagent` | subagent-driven-development | 大 task 拆分执行 |

每个 skill 模板包含：Iron Law / Red Flags / Rationalization Table / Verification Gate（来自 Superpowers 的反合理化机制）。

**实现位置**: `src/core/templates/workflows/` 新增对应文件，`src/core/config.ts` 的 AI_TOOLS 配置中注册新 skill。

### D5: propose/design/archive 模板增强

**选择**: 在现有模板基础上扩展，不改变模板结构

- **propose 模板** (`src/core/templates/workflows/propose.ts`): 增加 Domain Context 和 Risk Assessment section
- **design 模板**: 增加 Schema Changes 和 Implementation Strategy section
- **archive skill** (`src/core/templates/workflows/archive-change.ts`): 在归档前增加 verification gate 步骤

### D6: schema 文件的修改方式

**选择**: 修改内置的 `schemas/spec-driven/schema.yaml`

将 `tasks` artifact 替换为 `plan`，更新依赖链和 apply 跟踪目标。同时在 `schemas/spec-driven/templates/` 下新增 `plan.md` 模板。

## Risks / Trade-offs

**[Breaking changes]** → 这是 fork 项目，直接 breaking 不影响上游用户

**[plan 替代 tasks 的迁移]** → 现有活跃 changes 使用 tasks.md。迁移策略：手动将现有 tasks.md 重命名为 plan.md 并补充 strategy 标注

**[配置文件重命名]** → config.yaml → grspec.yaml 需要更新 `src/core/project-config.ts` 的文件查找逻辑。现有项目的 config.yaml 将不再被识别

**[Skill 数量增加]** → 新增 6 个 skill 模板，`grspec init` 生成时间略增。每个 skill 需要维护和测试

**[plan artifact 的模板设计]** → plan.md 的格式需要在保持 checkbox 可追踪性的同时支持 strategy/context 标注，格式设计需要平衡可读性和机器可解析性
