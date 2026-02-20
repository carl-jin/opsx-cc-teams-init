const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

const OPESPEC_DIR = 'openspec';
const SCHEMA_NAME = 'cc-teams';
const SOURCE_SCHEMA = 'spec-driven';

function checkOpenspecInitialized() {
  return fs.existsSync(OPESPEC_DIR);
}

function initOpenspec() {
  console.log('OpenSpec 未初始化，正在初始化...');
  try {
    execSync(`openspec init --tools cursor,claude`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✓ OpenSpec 初始化完成');
  } catch (error) {
    throw new Error(`OpenSpec 初始化失败: ${error.message}`);
  }
}

function forkSchema() {
  console.log(`正在 fork schema: ${SOURCE_SCHEMA} -> ${SCHEMA_NAME}...`);
  try {
    execSync(`openspec schema fork ${SOURCE_SCHEMA} ${SCHEMA_NAME} --force`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✓ Schema ${SCHEMA_NAME} 创建完成`);
  } catch (error) {
    throw new Error(`Schema fork 失败: ${error.message}`);
  }
}

function injectTeamAnalysisPrompt() {
  const schemaPath = path.join(OPESPEC_DIR, 'schemas', SCHEMA_NAME, 'schema.yaml');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema 文件不存在: ${schemaPath}`);
  }

  console.log('正在注入团队分析提示词...');
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schema = yaml.load(schemaContent);

  const teamAnalysisInstruction = `**⚠️ 强制要求：在开始实现任何代码之前，必须先完成并输出团队分析。这是必须执行的步骤，不能跳过。**

## 📋 第一步：团队分析（必须在编码前完成）

在执行任何实现任务之前，你必须：

1. **读取 tasks.md**：分析所有待完成的任务列表
2. **执行团队分析**：根据任务复杂度、依赖关系和技能要求，分析并输出：

   ### 团队配置方案
   
   - **所需团队规模**：完成所有任务最少需要多少名开发者
   - **角色分配**：每位开发者的专业角色（如前端、后端、DevOps、测试、产品等）
   - **任务分配矩阵**：以表格形式展示哪些任务分配给哪位开发者
   - **并行度分析**：哪些任务可以并行执行，哪些有依赖关系必须串行
   - **产品负责人**：指定产品负责人，负责根据 tasks.md 分析需求、分配任务、监督进度并完成最终验收

3. **输出格式**：以清晰的表格或结构化列表形式输出完整的团队配置方案

**🚫 禁止行为：在完成并输出团队分析之前，不得开始编写任何代码或实现任何任务。**

## ✅ 第二步：实现任务（仅在完成团队分析后执行）

只有在完成并输出团队分析后，才能继续执行以下步骤：
`;

  if (!schema.apply) {
    schema.apply = {};
  }

  if (schema.apply.instruction) {
    schema.apply.instruction = `${teamAnalysisInstruction}\n\n${schema.apply.instruction}`;
  } else {
    schema.apply.instruction = teamAnalysisInstruction;
  }

  const updatedContent = yaml.dump(schema, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });

  fs.writeFileSync(schemaPath, updatedContent, 'utf8');
  console.log('✓ 团队分析提示词已注入');
}

function updateTasksTemplate() {
  const tasksTemplatePath = path.join(OPESPEC_DIR, 'schemas', SCHEMA_NAME, 'templates', 'tasks.md');
  
  if (!fs.existsSync(tasksTemplatePath)) {
    console.log('⚠ tasks.md 模板不存在，跳过模板更新');
    return;
  }

  console.log('正在更新 tasks.md 模板...');
  
  let templateContent = fs.readFileSync(tasksTemplatePath, 'utf8');
  
  const teamAllocationSection = `

## Team Allocation

<!-- 团队分配信息将在此处生成 -->
`;
  
  if (!templateContent.includes('Team Allocation')) {
    templateContent += teamAllocationSection;
    fs.writeFileSync(tasksTemplatePath, templateContent, 'utf8');
    console.log('✓ tasks.md 模板已更新');
  } else {
    console.log('✓ tasks.md 模板已包含团队分配部分');
  }
}

function updateConfig() {
  const configPath = path.join(OPESPEC_DIR, 'config.yaml');
  
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(configContent) || {};
    } catch (error) {
      console.log('⚠ 无法解析现有 config.yaml，将创建新配置');
    }
  }

  console.log('正在更新 config.yaml...');
  
  config.schema = SCHEMA_NAME;
  
  if (!config.context) {
    config.context = '';
  }

  const updatedContent = yaml.dump(config, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });

  fs.writeFileSync(configPath, updatedContent, 'utf8');
  console.log(`✓ config.yaml 已更新，默认 schema 设置为: ${SCHEMA_NAME}`);
}

async function init() {
  console.log('🚀 开始初始化 opsx-cc-teams...\n');

  if (!checkOpenspecInitialized()) {
    initOpenspec();
  } else {
    console.log('✓ OpenSpec 已初始化\n');
  }

  forkSchema();
  injectTeamAnalysisPrompt();
  updateTasksTemplate();
  updateConfig();

  console.log('\n✅ 初始化完成！');
  console.log(`\n现在可以使用 /opsx:apply 命令，AI 会在实现前自动进行团队分析。`);
}

module.exports = { init };
