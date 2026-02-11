#!/usr/bin/env node

/**
 * 验证本地Supabase配置脚本
 * 检查所有必要的配置文件和设置是否正确
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function checkFileExists(filePath: string, description: string): boolean {
  const exists = fs.existsSync(filePath)
  if (exists) {
    console.log(`✅ ${description}: ${path.relative(process.cwd(), filePath)}`)
    return true
  } else {
    console.log(`❌ ${description}: 文件不存在`)
    return false
  }
}

function checkFileContent(filePath: string, description: string, expectedContent?: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${description}: 文件不存在`)
    return false
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  if (expectedContent && !content.includes(expectedContent)) {
    console.log(`⚠ ${description}: 内容可能不正确`)
    console.log(`   期望包含: ${expectedContent}`)
    return false
  }

  console.log(`✅ ${description}: 内容正确`)
  return true
}

async function verifyConfig() {
  console.log('🔍 验证本地Supabase配置...\n')

  let allPassed = true

  // 检查环境变量文件
  console.log('=== 环境变量文件 ===')
  allPassed = checkFileExists(
    path.join(__dirname, '..', '.env.local'),
    '开发环境变量文件'
  ) && allPassed

  allPassed = checkFileContent(
    path.join(__dirname, '..', '.env.local'),
    '本地Supabase URL配置',
    'http://localhost:54321'
  ) && allPassed

  allPassed = checkFileExists(
    path.join(__dirname, '..', '.env.production'),
    '生产环境变量模板'
  ) && allPassed

  // 检查Supabase配置文件
  console.log('\n=== Supabase配置 ===')
  allPassed = checkFileExists(
    path.join(__dirname, '..', 'supabase', 'config.toml'),
    'Supabase服务配置'
  ) && allPassed

  allPassed = checkFileExists(
    path.join(__dirname, '..', 'supabase', 'seed.sql'),
    '数据库种子数据'
  ) && allPassed

  // 检查迁移文件
  console.log('\n=== 数据库迁移 ===')
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    console.log(`✅ 迁移文件: ${migrations.length}个`)
    if (migrations.length === 0) {
      console.log('⚠ 警告: 没有迁移文件')
    }
  } else {
    console.log('❌ 迁移目录不存在')
    allPassed = false
  }

  // 检查代码配置
  console.log('\n=== 代码配置 ===')
  allPassed = checkFileExists(
    path.join(__dirname, '..', 'lib', 'supabase', 'config.ts'),
    '环境感知配置'
  ) && allPassed

  allPassed = checkFileContent(
    path.join(__dirname, '..', 'lib', 'supabase', 'client.ts'),
    '浏览器客户端配置',
    'getSupabaseConfig'
  ) && allPassed

  allPassed = checkFileContent(
    path.join(__dirname, '..', 'lib', 'supabase', 'server-client.ts'),
    '服务器端客户端配置',
    'getSupabaseConfig'
  ) && allPassed

  allPassed = checkFileContent(
    path.join(__dirname, '..', 'lib', 'supabase', 'middleware.ts'),
    '中间件配置',
    'getSupabaseConfig'
  ) && allPassed

  // 检查package.json脚本
  console.log('\n=== NPM脚本 ===')
  const packageJsonPath = path.join(__dirname, '..', 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const scripts = packageJson.scripts || {}

    const requiredScripts = [
      'supabase:start',
      'supabase:stop',
      'supabase:status',
      'supabase:reset',
      'dev:local',
      'db:local:types'
    ]

    let scriptsPassed = true
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        console.log(`✅ ${script}: 已定义`)
      } else {
        console.log(`❌ ${script}: 未定义`)
        scriptsPassed = false
      }
    })

    allPassed = scriptsPassed && allPassed
  }

  // 检查文档
  console.log('\n=== 文档 ===')
  allPassed = checkFileExists(
    path.join(__dirname, '..', 'LOCAL_DEVELOPMENT.md'),
    '本地开发指南'
  ) && allPassed

  // 总结
  console.log('\n=== 验证结果 ===')
  if (allPassed) {
    console.log('🎉 所有配置检查通过！')
    console.log('\n下一步：')
    console.log('1. 安装Docker Desktop (如果尚未安装)')
    console.log('2. 安装Supabase CLI: npm install -g supabase')
    console.log('3. 启动本地环境: npm run dev:local')
    console.log('4. 访问应用: http://localhost:3000')
  } else {
    console.log('⚠ 部分配置存在问题，请检查上述错误')
    console.log('\n修复建议：')
    console.log('1. 运行 npm run db:setup 查看详细设置说明')
    console.log('2. 检查缺少的文件并创建')
    console.log('3. 验证环境变量配置')
  }

  return allPassed
}

// 运行验证
if (require.main === module) {
  verifyConfig()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('验证过程中发生错误:', error)
      process.exit(1)
    })
}

export { verifyConfig }