# grspec 操作手册

快速参考，覆盖完整操作流。

---

## 目录结构

```
grspec/
├── specs/          ← 系统行为的唯一事实来源
├── changes/        ← 进行中的变更（每个变更一个文件夹）
│   └── archive/    ← 已归档的变更
├── wiki/           ← 可选知识库（AI 导航用）
└── grspec.yaml     ← 项目配置
```

---

## 核心流程（standard profile）

```
/grsx:propose ──► /grsx:apply ──► /grsx:archive
```

| 步骤 | 命令 | 做什么 |
|------|------|--------|
| 规划 | `/grsx:propose <name>` | 一次生成 proposal + specs + design + plan |
| 实现 | `/grsx:apply` | 按 plan 逐项写代码 |
| 归档 | `/grsx:archive` | 合并 delta specs → 主 specs，移入 archive |

可选命令：

- `/grsx:explore` — 需求不清时先探索
- `/grsx:sync` — 手动同步 delta specs（archive 会自动处理）

---

## 扩展命令（所有命令均可用，无需切换 profile）

```
/grsx:new ──► /grsx:ff 或 /grsx:continue ──► /grsx:apply ──► /grsx:verify ──► /grsx:archive
```

| 命令 | 用途 |
|------|------|
| `/grsx:new <name>` | 创建空变更文件夹 |
| `/grsx:ff` | 一次生成全部 artifacts |
| `/grsx:continue` | 逐个生成下一个 artifact |
| `/grsx:verify` | 验证实现是否匹配 specs |
| `/grsx:bulk-archive` | 批量归档多个变更 |

Profile 控制 AI 技能文件生成，不限制 CLI 命令。要让 AI 助手发现更多命令：`grspec config profile` → `grspec update`

---

## Artifact 依赖链

```
proposal → specs  → tasks
         → design ↗
```

| Artifact | 内容 |
|----------|------|
| `proposal.md` | 为什么做 + 做什么范围 |
| `specs/` | delta specs：ADDED / MODIFIED / REMOVED |
| `design.md` | 怎么做（技术方案、架构决策） |
| `tasks.md` | 实现清单，用 `- [ ]` / `- [x]` 跟踪进度 |

---

## Delta Spec 格式

```markdown
# Delta for Auth

## ADDED Requirements
### Requirement: Two-Factor Auth
The system MUST support TOTP-based 2FA.

#### Scenario: OTP required
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements
### Requirement: Session Timeout
The system SHALL expire sessions after 30 minutes.
(Previously: 60 minutes)

## REMOVED Requirements
### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

归档时：ADDED 追加、MODIFIED 替换、REMOVED 删除。

---

## CLI 常用命令

```bash
grspec list                 # 列出活跃变更
grspec list --specs         # 列出所有 specs
grspec show <name>          # 查看变更详情
grspec status --change <n>  # artifact 进度
grspec validate --all       # 校验格式
grspec view                 # 交互式面板
grspec archive <name> -y    # 非交互归档
grspec schemas              # 查看可用 schema
grspec activity --since=2w  # 最近 git 活动
```

---

## 决策参考

| 场景 | 推荐路径 |
|------|----------|
| 需求清楚，直接干 | `propose → apply → archive` |
| 想法模糊，先想清楚 | `explore → propose` |
| 想逐步控制 artifact | `new → continue × N → apply` |
| 赶时间 | `propose` 或 `new + ff` |
| 并行多变更 | 指定名称：`/grsx:apply <name>` 切换 |
| 归档前检查质量 | `/grsx:verify` |

### `/grsx:ff` vs `/grsx:continue`

| 情况 | 用 |
|------|-----|
| 需求清楚，赶时间 | `/grsx:ff` |
| 复杂变更，想逐步审查 | `/grsx:continue` |

### 何时新建 vs 更新现有变更

- **同一意图、范围微调** → 更新现有
- **意图变了、范围爆炸** → 新建变更

---

## 命名规范

```
✓ add-dark-mode, fix-login-redirect, optimize-query
✗ feature-1, update, wip, changes
```

---

## UI/UX 设计智能

内置知识库：67 种风格、161 色板、57 组字体、99 条 UX 规则、25 种图表，跨 16 个技术栈。

### 核心命令

```bash
# 生成设计系统（新项目必做）
grspec ui design-system "<产品类型> <行业> <关键词>" -p "项目名"

# 持久化到变更目录
grspec ui design-system "..." -p "项目名" --persist

# 领域搜索
grspec ui search "<关键词>" --domain <domain>

# 技术栈指南
grspec ui search "<关键词>" --stack <stack>
```

### 可搜索领域

| Domain | 用途 |
|--------|------|
| `product` | 产品类型模板 |
| `style` | 视觉风格 |
| `color` | 配色方案 |
| `typography` | 字体搭配 |
| `chart` | 图表推荐 |
| `ux` | 交互规则 |
| `landing` | 着陆页结构 |
| `react` | React 性能 |
| `web` | Web/App 无障碍 |

可选 stack：react, nextjs, vue, svelte, astro, swiftui, react-native, flutter, nuxt-ui, shadcn, html-tailwind, threejs, angular, laravel 等。

### UI 审查

```bash
grspec ui review <path> --json          # 静态检查
grspec ui rules --platform web --checklist  # 全规则清单
grspec ui rules Accessibility --checklist   # 指定类别
grspec ui reference <style-name>        # 查看风格规格
grspec ui status                        # 当前设计系统状态
```

### 交付前检查清单

- [ ] 不用 emoji 当图标（SVG：Heroicons/Lucide/Phosphor）
- [ ] `cursor-pointer` on all clickable
- [ ] Hover transition 150–300ms
- [ ] 文字对比度 ≥ 4.5:1
- [ ] Focus 状态可见
- [ ] `prefers-reduced-motion` 已处理
- [ ] 响应式：375px / 768px / 1024px / 1440px
- [ ] 触控目标 ≥ 44×44pt
- [ ] Safe area 已适配

### 与变更流程集成

1. **项目基础** — `grspec ui init --type <产品类型>` 写入 `grspec/ui/MASTER.md`
2. **UI artifact 阶段** — v2 变更在 `ui.md` 完成后，用 `grspec ui design-system ... --persist --page <name>` 写入 `grspec/changes/<name>/ui/pages/`
3. **Apply 阶段** — `contextFiles.ui` 自动加载 `ui.md`、`grspec/ui/MASTER.md` 与 change `ui/pages/`
4. **独立使用** — 任何时候 `grspec ui search/review`

---

## Wiki 知识库

可选的 LLM 导航知识层，随项目演进自动增长。

### 启用

```yaml
# grspec/grspec.yaml
wiki:
  enabled: true
```

### 目录结构

```
grspec/wiki/
├── index.md        ← 导航入口（AI 先读这个）
├── overview.md     ← 项目概述
├── log.md          ← 操作时间线
├── concepts/       ← 架构概念
├── entities/       ← 模块/命令/依赖
├── sources/        ← 变更摘要
└── comparisons/    ← 方案对比
```

### 操作命令

| 命令 | 做什么 |
|------|--------|
| `/grsx-wiki-init` | 从头构建整个 wiki |
| `/grsx-wiki-ingest` | 为当前变更生成 wiki 增量 |
| `/grsx-wiki-query` | 按 wikilink 导航回答问题 |
| `/grsx-wiki-lint` | 结构 + 语义健康检查 |
| `/grsx-wiki-sync` | 合并增量到主 wiki |
| `/grsx-wiki-status` | 查看 wiki 概况 |

CLI：`grspec wiki lint` / `grspec wiki status`

### 页面格式

```markdown
---
title: "Context Injection"
type: concept
sources:
  - src/core/instruction-loader.ts
related:
  - "[[instruction-loader]]"
  - "[[project-config]]"
created: 2025-08-20
updated: 2025-09-15
confidence: high
---

# Context Injection

正文用 markdown，跨页引用用 [[wikilinks]]。
```

### 工作流集成

```
/grsx:propose ──► /grsx-wiki-ingest ──► /grsx:apply ──► /grsx:archive
                     │                                       │
                     └─ 生成 wiki 增量                   自动合并增量
```

### 核心规则

- 先读 `index.md`，不要把整个 wiki 塞进上下文
- 按 `[[wikilinks]]` 逐页导航
- 一页一主题
- 归档时自动合并 wiki 增量并释放页面锁

---

## 工具语法对照

| 工具 | 命令格式 |
|------|----------|
| Claude Code | `/grsx:propose`, `/grsx:apply` |
| Cursor | `/grsx-propose`, `/grsx-apply` |
| Windsurf | `/grsx-propose`, `/grsx-apply` |
| Copilot (IDE) | `/grsx-propose`, `/grsx-apply` |

---

## 一句话总结

**propose → apply → archive**，其余皆可选辅助。
