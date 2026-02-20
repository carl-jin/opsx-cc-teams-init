# opsx-cc-teams-init

为 OpenSpec 项目自动配置团队分析功能的 CLI 工具。

## 功能

- 自动检测项目是否已初始化 OpenSpec
- 如未初始化，自动执行 `openspec init`
- Fork `spec-driven` schema 为 `cc-teams` 自定义 schema
- 在 schema 中注入团队分析提示词，使 `/opsx:apply` 在执行前自动分析所需团队配置
- 更新项目配置使用新的 schema

## 安装

```bash
npm install -g opsx-cc-teams-init
```

或使用 npm link 进行本地开发：

```bash
git clone https://github.com/your-username/opsx-cc-teams-init.git
cd opsx-cc-teams-init
npm install
npm link
```

## 使用方法

在项目根目录执行：

```bash
opsx-cc-teams-init
```

### 示例

```bash
# 进入你的项目目录
cd my-project

# 运行初始化命令
opsx-cc-teams-init

# 输出示例：
# 🚀 开始初始化 opsx-cc-teams...
# ✓ OpenSpec 已初始化
# 正在 fork schema: spec-driven -> cc-teams...
# ✓ Schema cc-teams 创建完成
# 正在注入团队分析提示词...
# ✓ 团队分析提示词已注入
# 正在更新 tasks.md 模板...
# ✓ tasks.md 模板已更新
# 正在更新 config.yaml...
# ✓ config.yaml 已更新，默认 schema 设置为: cc-teams
# ✅ 初始化完成！
```

## 工作原理

1. **检测 OpenSpec 初始化状态**
   - 检查 `openspec/` 目录是否存在
   - 如不存在，执行 `openspec init --tools cursor,claude`

2. **Fork Schema**
   - 执行 `openspec schema fork spec-driven cc-teams --force`
   - 创建自定义 schema 到 `openspec/schemas/cc-teams/`

3. **注入团队分析提示词**
   - 修改 `openspec/schemas/cc-teams/schema.yaml`
   - 在 `apply.instruction` 中添加团队分析要求

4. **更新配置**
   - 更新 `openspec/config.yaml`，设置默认 schema 为 `cc-teams`
   - 更新 `tasks.md` 模板，添加 Team Allocation 部分

## 团队分析功能

配置完成后，当使用 `/opsx:apply` 命令时，AI 会在实现任务前自动进行团队分析，包括：

- **所需团队规模**：完成所有任务最少需要多少名开发者
- **角色分配**：每位开发者的专业角色（如前端、后端、DevOps 等）
- **任务分配矩阵**：哪些任务分配给哪位开发者
- **并行度分析**：哪些任务可以并行执行，哪些有依赖关系必须串行
- **产品负责人**：负责根据 tasks.md 分析需求，分配任务和监督进度并完成最终验收

## 要求

- Node.js >= 20.19.0
- OpenSpec CLI (`@fission-ai/openspec`) 已全局安装

## 开发

```bash
# 克隆仓库
git clone https://github.com/your-username/opsx-cc-teams-init.git
cd opsx-cc-teams-init

# 安装依赖
npm install

# 本地链接
npm link

# 测试
cd test-project
opsx-cc-teams-init
```

## License

MIT
