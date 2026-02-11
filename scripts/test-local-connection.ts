#!/usr/bin/env node

/**
 * 测试本地Supabase连接脚本
 * 用于验证本地Supabase服务是否正常工作
 */

import { createClient } from '@/lib/supabase/client'

async function testLocalConnection() {
  console.log('🧪 测试本地Supabase连接...')
  console.log('环境:', process.env.NODE_ENV)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  const supabase = createClient()

  try {
    // 测试数据库连接
    console.log('\n1. 测试数据库连接...')
    const { data: projects, error: dbError } = await supabase
      .from('projects')
      .select('count')
      .limit(1)

    if (dbError) {
      console.error('❌ 数据库连接失败:', dbError.message)
      console.error('详细信息:', dbError)
      return false
    }

    console.log('✅ 数据库连接成功')

    // 测试Auth服务
    console.log('\n2. 测试Auth服务...')
    const { data: authData, error: authError } = await supabase.auth.getSession()

    if (authError) {
      console.error('❌ Auth服务检查失败:', authError.message)
    } else {
      console.log('✅ Auth服务正常')
      if (authData.session) {
        console.log('   当前会话:', authData.session.user.email)
      } else {
        console.log('   无活动会话')
      }
    }

    // 测试实时订阅
    console.log('\n3. 测试实时订阅...')
    const channel = supabase.channel('test-connection')

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ 实时订阅连接成功')
        channel.unsubscribe()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ 实时订阅已建立')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ 实时订阅错误')
        }
      })

    // 测试存储服务
    console.log('\n4. 测试存储服务...')
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

    if (storageError) {
      console.log('⚠ 存储服务检查:', storageError.message)
    } else {
      console.log('✅ 存储服务正常')
      console.log(`   可用存储桶: ${buckets?.length || 0}个`)
    }

    // 列出所有表
    console.log('\n5. 检查数据库表...')
    const { data: tables, error: tablesError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    if (tablesError) {
      console.error('❌ 无法查询表:', tablesError.message)
    } else {
      console.log('✅ 表查询成功')
    }

    // 测试用户注册（可选）
    console.log('\n6. 测试用户注册功能...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123'

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.log('⚠ 用户注册测试:', signUpError.message)
      console.log('   注意：本地Supabase可能需要配置邮件服务')
    } else {
      console.log('✅ 用户注册功能正常')
      console.log(`   测试用户: ${testEmail}`)

      // 清理测试用户
      if (signUpData.user) {
        console.log('   已创建测试用户，建议在Supabase Studio中清理')
      }
    }

    console.log('\n🎉 本地Supabase连接测试完成！')
    console.log('\n=== 下一步 ===')
    console.log('1. 访问本地Supabase Studio: http://localhost:54323')
    console.log('2. 查看数据库表和数据')
    console.log('3. 配置Auth设置（如重定向URL）')
    console.log('4. 启动应用: npm run dev')
    console.log('5. 访问应用: http://localhost:3000')

    return true

  } catch (error) {
    console.error('❌ 测试过程中发生错误:')
    console.error(error)

    console.log('\n=== 故障排除 ===')
    console.log('1. 确保Supabase服务正在运行: npm run supabase:status')
    console.log('2. 检查环境变量: cat .env.local')
    console.log('3. 重启服务: npm run supabase:stop && npm run supabase:start')
    console.log('4. 重置数据库: npm run supabase:reset')

    return false
  }
}

// 运行测试
if (require.main === module) {
  testLocalConnection()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('测试脚本执行失败:', error)
      process.exit(1)
    })
}

export { testLocalConnection }