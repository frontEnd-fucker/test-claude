#!/usr/bin/env node

/**
 * 验证E2E测试设置脚本
 * 检查必要的文件、依赖和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 验证E2E测试设置...\n');

// 检查的文件和目录
const requiredFiles = [
  'playwright.config.ts',
  'e2e/create-project.spec.ts',
  'e2e/create-project-pom.spec.ts',
  'e2e/pages/LoginPage.ts',
  'e2e/pages/ProjectsPage.ts',
  'e2e/pages/ProjectFormDialog.ts',
  'e2e/utils/test-helpers.ts',
  'e2e/.env.example',
  'e2e/README.md',
];

const requiredDirs = [
  'e2e',
  'e2e/pages',
  'e2e/utils',
];

// 检查目录
console.log('📁 检查目录结构...');
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✓ ${dir}`);
  } else {
    console.log(`  ✗ ${dir} - 目录不存在`);
    process.exit(1);
  }
}

// 检查文件
console.log('\n📄 检查文件...');
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - 文件不存在`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ 缺少必要的文件，请重新运行设置脚本');
  process.exit(1);
}

// 检查package.json
console.log('\n📦 检查package.json配置...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // 检查脚本
  const requiredScripts = [
    'test:e2e',
    'test:e2e:ui',
    'test:e2e:debug',
    'test:e2e:headed',
    'test:e2e:report',
    'test:e2e:install',
    'test:e2e:codegen',
  ];

  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✓ 脚本: ${script}`);
    } else {
      console.log(`  ✗ 脚本: ${script} - 未定义`);
    }
  }

  // 检查依赖
  const requiredDeps = ['@playwright/test', 'dotenv'];
  for (const dep of requiredDeps) {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`  ✓ 依赖: ${dep}`);
    } else {
      console.log(`  ✗ 依赖: ${dep} - 未安装`);
    }
  }
} else {
  console.log('  ✗ package.json 不存在');
  process.exit(1);
}

// 检查.gitignore
console.log('\n🔒 检查.gitignore配置...');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const requiredPatterns = [
    'test-results/',
    'playwright-report/',
    'playwright/.cache/',
  ];

  for (const pattern of requiredPatterns) {
    if (gitignoreContent.includes(pattern)) {
      console.log(`  ✓ 忽略: ${pattern}`);
    } else {
      console.log(`  ✗ 忽略: ${pattern} - 未配置`);
    }
  }
} else {
  console.log('  ⚠  .gitignore 不存在');
}

// 检查环境变量配置
console.log('\n⚙️ 检查环境变量配置...');
const envExamplePath = path.join(__dirname, '..', 'e2e', '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  const requiredVars = [
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
    'BASE_URL',
  ];

  for (const varName of requiredVars) {
    if (envExampleContent.includes(varName)) {
      console.log(`  ✓ 变量: ${varName}`);
    } else {
      console.log(`  ✗ 变量: ${varName} - 未定义`);
    }
  }

  // 检查实际.env文件
  const envPath = path.join(__dirname, '..', 'e2e', '.env');
  if (fs.existsSync(envPath)) {
    console.log('  ✓ .env 文件存在');

    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('test@example.com') && envContent.includes('password123')) {
      console.log('  ⚠  警告: 使用默认测试凭据，建议更新为实际值');
    }
  } else {
    console.log('  ⚠  警告: .env 文件不存在，运行: cp e2e/.env.example e2e/.env');
  }
}

// 检查TypeScript配置
console.log('\n📝 检查TypeScript配置...');
const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('  ✓ tsconfig.json 存在');

  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (tsconfig.compilerOptions && tsconfig.compilerOptions.target) {
      console.log(`  ✓ TypeScript目标: ${tsconfig.compilerOptions.target}`);
    }
  } catch (error) {
    console.log('  ⚠  tsconfig.json 解析错误');
  }
} else {
  console.log('  ⚠  tsconfig.json 不存在');
}

// 检查Playwright安装
console.log('\n🌐 检查Playwright安装...');
try {
  execSync('npx playwright --version', { stdio: 'pipe' });
  console.log('  ✓ Playwright 已安装');
} catch (error) {
  console.log('  ⚠  Playwright 未安装，运行: npx playwright install');
}

// 检查浏览器安装
console.log('\n🖥️ 检查浏览器安装...');
try {
  const result = execSync('npx playwright install --dry-run', { stdio: 'pipe' }).toString();
  if (result.includes('chromium')) {
    console.log('  ✓ Chromium 浏览器可用');
  } else {
    console.log('  ⚠  Chromium 浏览器未安装，运行: npx playwright install chromium');
  }
} catch (error) {
  console.log('  ⚠  无法检查浏览器安装状态');
}

console.log('\n✅ 验证完成！');
console.log('\n下一步:');
console.log('1. 安装依赖: npm install');
console.log('2. 安装浏览器: npx playwright install');
console.log('3. 配置环境变量: cp e2e/.env.example e2e/.env');
console.log('4. 编辑 e2e/.env 文件，填写测试用户凭据');
console.log('5. 启动开发服务器: npm run dev');
console.log('6. 运行测试: npm run test:e2e');
console.log('\n更多信息请参考:');
console.log('- TESTING.md - 测试运行指南');
console.log('- e2e/README.md - 测试结构说明');
console.log('- MIGRATION.md - 迁移指南');