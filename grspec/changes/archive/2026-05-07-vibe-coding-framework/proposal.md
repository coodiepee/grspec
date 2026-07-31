## Why

grspec 当前继承了 OpenSpec 的核心 artifact 工作流（explore → propose → design → apply → archive），但缺少三个关键维度：领域知识沉淀机制、执行纪律约束、以及并行协作基础设施。pr.md 中的对比分析表明，Spec-Kit 的 constitution 概念和 gate 机制、Superpowers 的 TDD/verification/debugging/review 纪律以及 subagent 并行架构，都是 grspec 可以直接整合的互补能力。

本变更将 grspec 从「变更驱动的规格工作流」升级为「Vibe Coding Framework」——一个融合领域知识、变更工作流、执行纪律和协作基础设施的完整 AI 编程方法论。

## What Changes

**知识层 (Knowledge Layer)**
- **BREAKING** `grspec init` 增加 `--track new-project|existing-project` 模式，新项目模式自动生成 `constitution.md` 和 `domain-model.md` 模板
- 新增 `grspec/constitution.md` 模板（项目宪法：Project Identity / Architecture Principles / Coding Standards / Team Agreements）
- 新增 `grspec/domain-model.md` 模板（领域模型：Bounded Contexts / Core Entities / Context Map）
- **BREAKING** `grspec/config.yaml` 升级为 `grspec/grspec.yaml`，扩展配置结构支持 knowledge/workflow/execution/codegen/collaboration/bootstrap 字段

**变更工作流增强 (Workflow Enhancement)**
- **BREAKING** schema 新增 `plan` artifact 阶段（位于 design/specs 之后、apply 之前）
- propose 增强：新增 Domain Context（影响的 Bounded Context）和 Risk Assessment 字段
- design 增强：新增 Schema Changes 和 Implementation Strategy 字段
- plan：细粒度任务分解，每个 task 标注 strategy（codegen/TDD/AI+review/手动）、bounded context、验证步骤、commit 节点
- archive 增强：归档前增加全量验证 gate

**执行纪律层 (Execution Discipline)**
- 新增 TDD skill（RED-GREEN-REFACTOR 循环，按 task strategy 启用）
- 新增 verification-before-completion skill（不验证不标记完成）
- 新增 systematic-debugging skill（四阶段调试方法论）
- 新增 dual-stage code review skill（spec compliance → code quality）
- 每个 discipline skill 包含 Iron Law / Red Flags / Rationalization Table / Verification Gate

**协作基础设施层 (Collaboration Infrastructure)**
- 新增 subagent-dispatch skill（每个 task 独立 agent）
- 新增 parallel-dispatch skill（按 bounded-context 分组并行）
- 新增 model-selection 策略（按 task 复杂度选模型）
- 集成 git worktree 隔离（每个 change 可选独立 worktree）

## Capabilities

### New Capabilities
- `constitution`: 项目宪法模板生成和管理（Project Identity / Architecture Principles / Coding Standards / Team Agreements）
- `domain-model`: 领域模型模板生成和管理（Bounded Contexts / Core Entities / Context Map）
- `plan-artifact`: schema 中新增 plan 阶段，支持细粒度任务分解和 strategy 标注
- `execution-discipline`: TDD / verification / debugging / review 执行纪律 skills
- `collaboration-infra`: subagent dispatch / parallel dispatch / model selection / worktree 协作能力
- `project-bootstrap`: 新项目初始化轨道（domain modeling → architecture → schema bootstrap → skeleton）

### Modified Capabilities
- `cli-init`: 支持 `--track` 参数，区分新项目/存量项目初始化，生成 constitution.md 和 domain-model.md
- `cli-archive`: 归档前增加全量验证 gate（verification-before-completion）
- `openspec-conventions`: 目录结构变更——新增 constitution.md、domain-model.md、grspec.yaml；变更级 change 支持 bounded-context 标注
- `schema-resolution`: spec-driven schema 新增 plan artifact，调整依赖链
- `artifact-graph`: 支持 plan artifact 的状态追踪和依赖解析
- `cli-config`: 配置文件从 config.yaml 升级为 grspec.yaml，扩展字段结构

## Impact

- **Schema 系统**: spec-driven schema 新增 plan artifact，影响 artifact graph、instruction loader、status 命令
- **CLI 命令**: init 命令扩展、archive 命令增强、instructions 命令支持 plan artifact
- **模板系统**: 新增 constitution.md、domain-model.md、plan.md 模板
- **Skill 系统**: 新增 6+ 个 workflow skills（TDD、verification、debugging、review、subagent、parallel）
- **配置系统**: 配置文件结构重构，从 config.yaml 升级为 grspec.yaml
- **测试**: 所有涉及的模块需要新增/更新测试用例
