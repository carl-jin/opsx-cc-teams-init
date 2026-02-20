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

  const teamAnalysisInstruction = `**⚠️ MANDATORY: Before starting any code implementation, you MUST first complete and output team analysis. This is a required step that cannot be skipped.**

## 📋 Step 1: Team Analysis (Must be completed before coding)

Before executing any implementation tasks, you must:

1. **Read tasks.md**: Analyze all pending tasks in the checklist
2. **Perform team analysis**: Based on task complexity, dependencies, and skill requirements, analyze and output:

   ### Team Configuration Plan
   
   - **Required Team Size**: Minimum number of developers needed to complete all tasks
   - **Role Assignment**: Professional role for each developer (e.g., Frontend, Backend, DevOps, QA, Product, etc.)
   - **Task Allocation Matrix**: Display which tasks are assigned to which developer in table format
   - **Parallelism Analysis**: Which tasks can be executed in parallel, and which have dependencies requiring sequential execution
   - **Product Owner**: Designate a product owner responsible for analyzing requirements from tasks.md, allocating tasks, monitoring progress, and completing final acceptance

3. **Output Format**: Output the complete team configuration plan in clear table or structured list format

**🚫 PROHIBITED: Do not start writing any code or implementing any tasks until you have completed and output the team analysis.**

## ✅ Step 2: Implement Tasks (Only after team analysis is complete)

Only after completing and outputting the team analysis, proceed with the following steps:
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
