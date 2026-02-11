#!/bin/bash

# 项目成员管理功能E2E测试验证脚本

echo "=== 项目成员管理功能E2E测试验证 ==="
echo

# 检查环境变量
echo "1. 检查环境变量配置..."
if [ -f ".env" ]; then
    echo "   ✓ 找到.env文件"

    # 检查测试用户邮箱
    if grep -q "TEST_USER_EMAIL" .env; then
        TEST_USER_EMAIL=$(grep "TEST_USER_EMAIL" .env | cut -d'=' -f2)
        echo "   ✓ TEST_USER_EMAIL已配置: $TEST_USER_EMAIL"
    else
        echo "   ✗ TEST_USER_EMAIL未配置，测试无法运行"
        exit 1
    fi

    # 检查测试成员邮箱
    if grep -q "TEST_MEMBER_EMAIL" .env; then
        TEST_MEMBER_EMAIL=$(grep "TEST_MEMBER_EMAIL" .env | cut -d'=' -f2)
        echo "   ✓ TEST_MEMBER_EMAIL已配置: $TEST_MEMBER_EMAIL"

        if [ "$TEST_MEMBER_EMAIL" = "test.member@example.com" ]; then
            echo "   ⚠  TEST_MEMBER_EMAIL使用默认值，请配置实际的测试成员邮箱"
            echo "      注意：测试成员需要是一个已注册的用户"
        fi
    else
        echo "   ⚠  TEST_MEMBER_EMAIL未配置，部分测试将跳过"
        echo "      请参考 TEST_MEMBER_SETUP.md 配置第二个测试用户"
    fi
else
    echo "   ✗ 未找到.env文件，请复制.env.example为.env并配置"
    exit 1
fi

echo

# 检查新创建的文件是否存在
echo "2. 检查新创建的测试文件..."
NEW_FILES=(
    "pages/ProjectDetailPage.ts"
    "utils/member-test-helpers.ts"
    "specs/project-members.spec.ts"
)

ALL_NEW_FILES_EXIST=true
for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"

        # 检查文件内容
        if [ -s "$file" ]; then
            echo "     文件大小: $(wc -l < "$file") 行"
        else
            echo "     ⚠ 文件为空"
            ALL_NEW_FILES_EXIST=false
        fi
    else
        echo "   ✗ $file - 未找到"
        ALL_NEW_FILES_EXIST=false
    fi
done

echo

# 检查更新的文件
echo "3. 检查更新的文件..."
UPDATED_FILES=(
    "pages/AddMemberDialog.ts"
)

for file in "${UPDATED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"

        # 检查是否包含新增的方法
        if grep -q "getSuccessMessage" "$file"; then
            echo "     包含新增的getSuccessMessage方法"
        else
            echo "     ⚠ 未找到新增的getSuccessMessage方法"
        fi
    else
        echo "   ✗ $file - 未找到"
    fi
done

echo

# 检查TypeScript编译
echo "4. 检查TypeScript编译..."
if command -v npx &> /dev/null; then
    cd ..
    echo "   运行TypeScript编译检查..."
    npx tsc --noEmit 2>&1 | grep -E "(error|Error|ERROR)" | head -10
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "   ✓ TypeScript编译通过"
    else
        echo "   ⚠  TypeScript编译有错误，请检查上面的输出"
    fi
    cd e2e
else
    echo "   ⚠  未找到npx，跳过TypeScript检查"
fi

echo

# 显示测试用例信息
echo "5. 测试用例概览..."
echo "   已实现以下测试用例："
echo "   1. 成功添加新成员（通过邮箱邀请）"
echo "   2. 成功删除成员"
echo "   3. 添加和删除成员的完整流程"
echo
echo "   测试覆盖以下功能："
echo "   - 项目详情页导航"
echo "   - 成员列表显示"
echo "   - 添加成员对话框操作"
echo "   - 成员删除功能"
echo "   - 状态持久化验证"

echo

# 运行测试指南
echo "6. 运行测试指南"
echo "   要运行成员管理测试，请执行:"
echo "   npx playwright test e2e/specs/project-members.spec.ts"
echo
echo "   要运行所有E2E测试，请执行:"
echo "   npx playwright test"
echo
echo "   要使用UI模式运行测试，请执行:"
echo "   npx playwright test --ui"
echo
echo "   要查看测试报告，请执行:"
echo "   npx playwright show-report"

echo
echo "=== 验证完成 ==="
echo
echo "重要提示："
echo "1. 确保应用程序正在运行（npm run dev）"
echo "2. 确保Supabase项目中有两个测试用户账号"
echo "3. 测试成员邮箱（TEST_MEMBER_EMAIL）必须是已注册的用户"
echo "4. 测试用户（TEST_USER_EMAIL）必须是项目所有者"
echo
echo "测试前提条件："
echo "- 测试用户有权限创建项目"
echo "- 测试用户有权限管理项目成员"
echo "- 测试成员邮箱对应的用户已注册"
echo
echo "如果测试失败："
echo "1. 检查应用程序是否正常运行"
echo "2. 检查测试用户凭据是否正确"
echo "3. 检查测试成员邮箱是否正确"
echo "4. 查看Playwright测试报告获取详细信息"