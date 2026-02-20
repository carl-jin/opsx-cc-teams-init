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

  const teamAnalysisInstruction = `在开始实现任务之前，你必须先执行团队分析：

## 团队分析（必须在编码前完成）

根据 tasks.md 中的所有任务，分析并输出：

1. **所需团队规模**：完成所有任务最少需要多少名开发者
2. **角色分配**：每位开发者的专业角色（如前端、后端、DevOps 等）
3. **任务分配矩阵**：哪些任务分配给哪位开发者
4. **并行度分析**：哪些任务可以并行执行，哪些有依赖关系必须串行
5. **产品负责人**：每个团队必须存在一个产品负责人，负责根据 tasks.md 分析需求，分配任务和监督进度已经完成最终验收

请以表格形式输出团队配置方案，然后再开始逐个实现任务。`;

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
