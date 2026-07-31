## 1. 配置系统升级 (config.yaml → grspec.yaml)

- [x] 1.1 更新 `src/core/project-config.ts`：将配置文件查找名从 `config.yaml` 改为 `grspec.yaml`
- [x] 1.2 更新 `src/core/config-schema.ts`：用 Zod 定义扩展字段 schema（knowledge/workflow/execution/codegen/collaboration/bootstrap）
- [x] 1.3 更新 `src/core/global-config.ts`：适配新配置文件名
- [x] 1.4 更新项目自身的 `grspec/config.yaml` → `grspec/grspec.yaml`
- [x] 1.5 更新所有引用 `config.yaml` 的源文件和文档
- [x] 1.6 编写配置系统升级的单元测试
- [x] 1.7 跨平台路径测试（Windows path 验证）

## 2. Schema 系统：新增 plan artifact

- [x] 2.1 修改 `schemas/spec-driven/schema.yaml`：用 `plan` 替代 `tasks`，更新依赖链 `plan.requires = [design, specs]`，`apply.requires = [plan]`
- [x] 2.2 创建 `schemas/spec-driven/templates/plan.md`：plan 模板，包含 strategy/bounded-context/verification 标注格式
- [x] 2.3 更新 `src/core/artifact-graph/resolver.ts`：支持 plan artifact 的解析和状态追踪
- [x] 2.4 更新 `src/core/artifact-graph/instruction-loader.ts`：支持 `grspec instructions plan` 命令
- [x] 2.5 更新 `src/commands/workflow/status.ts`：plan artifact 的状态显示
- [x] 2.6 更新 `src/commands/workflow/instructions.ts`：plan artifact 的指令输出
- [x] 2.7 编写 plan artifact 的单元测试和集成测试

## 3. 知识层模板：constitution.md + domain-model.md

- [x] 3.1 创建 `src/core/templates/constitution.ts`：constitution.md 模板内容（新项目版 + 存量项目版）
- [x] 3.2 创建 `src/core/templates/domain-model.ts`：domain-model.md 模板内容（新项目版 + 存量项目版）
- [x] 3.3 更新 `src/core/init.ts`：支持 `--track new-project|existing-project` 参数
- [x] 3.4 `--track new-project` 模式：生成完整的 constitution.md + domain-model.md + grspec.yaml (bootstrap 字段)
- [x] 3.5 `--track existing-project` 模式：生成带逆向梳理指引的 constitution.md + domain-model.md 骨架
- [x] 3.6 更新 `src/cli/index.ts`：注册 `--track` 选项到 init 命令
- [x] 3.7 编写 init --track 的单元测试
- [x] 3.8 跨平台路径测试（constitution.md / domain-model.md 生成路径）

## 4. 变更工作流模板增强

- [x] 4.1 更新 `src/core/templates/workflows/propose.ts`：propose 模板增加 Domain Context + Risk Assessment section
- [x] 4.2 更新 `src/core/templates/workflows/apply-change.ts`：适配 plan.md（原 tasks.md）
- [x] 4.3 更新 `src/core/templates/workflows/archive-change.ts`：增加 verification gate 步骤
- [x] 4.4 更新 `src/core/templates/workflows/new-change.ts`：change 级 .grspec.yaml 支持 bounded-context 字段
- [x] 4.5 更新模板 parity 测试

## 5. 执行纪律 Skills

- [x] 5.1 创建 `src/core/templates/workflows/tdd.ts`：TDD RED-GREEN-REFACTOR skill 模板（含 Iron Law / Red Flags / Rationalization Table / Verification Gate）
- [x] 5.2 创建 `src/core/templates/workflows/verify.ts`：verification-before-completion skill 模板
- [x] 5.3 创建 `src/core/templates/workflows/debug.ts`：systematic-debugging skill 模板（四阶段：Reproduce → Isolate → Fix → Verify）
- [x] 5.4 创建 `src/core/templates/workflows/review.ts`：dual-stage code review skill 模板（spec compliance → code quality）
- [x] 5.5 更新 `src/core/config.ts`：在 AI_TOOLS 配置中注册新 skill ID（grspec-tdd / grspec-verify / grspec-debug / grspec-review）
- [x] 5.6 更新 `src/core/shared/skill-generation.ts`：支持生成新 skills 到用户项目
- [x] 5.7 编写执行纪律 skill 模板的单元测试

## 6. 协作基础设施 Skills

- [x] 6.1 创建 `src/core/templates/workflows/parallel-dispatch.ts`：parallel-dispatch skill 模板（按 bounded-context 分组）
- [x] 6.2 创建 `src/core/templates/workflows/subagent.ts`：subagent-driven-development skill 模板
- [x] 6.3 更新 `src/core/config.ts`：注册协作 skill ID（grspec-parallel / grspec-subagent）
- [x] 6.4 编写协作 skill 模板的单元测试

## 7. CLI archive 增强

- [x] 7.1 更新 `src/core/archive.ts`：归档前增加 verification gate（build/test/lint 检查）
- [x] 7.2 添加 `--force` 选项允许跳过 verification gate
- [x] 7.3 编写 archive verification gate 的单元测试

## 8. 文档和自身 dogfooding

- [x] 8.1 更新 `docs/pr.md`：反映最终实现的架构
- [x] 8.2 更新 `docs/concepts.md`：增加知识层、执行纪律、协作基础设施的概念说明
- [x] 8.3 更新 `docs/commands.md`：记录 `--track` 参数和新 skill 命令
- [x] 8.4 更新 `README.md`：反映 Vibe Coding Framework 定位
- [x] 8.5 为 grspec 项目自身创建 `grspec/constitution.md`（dogfooding）
- [x] 8.6 为 grspec 项目自身创建 `grspec/domain-model.md`（dogfooding）

## 9. 全量验证

- [ ] 9.1 运行 `pnpm run build` 确认 TypeScript 编译通过
- [ ] 9.2 运行 `pnpm test` 确认所有测试通过
- [ ] 9.3 运行 `node bin/grspec.js init` 在临时目录验证完整初始化流程
- [ ] 9.4 运行 `node bin/grspec.js status --change vibe-coding-framework` 验证状态追踪
- [ ] 9.5 跨平台验证（Windows 路径兼容性）
