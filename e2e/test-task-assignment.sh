#!/bin/bash

# 任务分配功能E2E测试验证脚本

echo "=== 任务分配功能E2E测试验证 ==="
echo

# 检查环境变量
echo "1. 检查环境变量配置..."
if [ -f ".env" ]; then
    echo "   ✓ 找到.env文件"

    if grep -q "TEST_MEMBER_EMAIL" .env; then
        TEST_MEMBER_EMAIL=$(grep "TEST_MEMBER_EMAIL" .env | cut -d'=' -f2)
        echo "   ✓ TEST_MEMBER_EMAIL已配置: $TEST_MEMBER_EMAIL"

        if [ "$TEST_MEMBER_EMAIL" = "test.member@example.com" ]; then
            echo "   ⚠  TEST_MEMBER_EMAIL使用默认值，请配置实际的测试成员邮箱"
        fi
    else
        echo "   ⚠  TEST_MEMBER_EMAIL未配置，部分测试将跳过"
        echo "      请参考 TEST_MEMBER_SETUP.md 配置第二个测试用户"
    fi
else
    echo "   ⚠  未找到.env文件，请复制.env.example为.env并配置"
fi

echo

# 检查文件是否存在
echo "2. 检查测试文件..."
FILES=(
    "pages/TaskDetailPage.ts"
    "pages/TaskFormDialog.ts"
    "pages/AddMemberDialog.ts"
    "utils/task-test-helpers.ts"
    "specs/task-assignment.spec.ts"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ✗ $file - 未找到"
        ALL_FILES_EXIST=false
    fi
done

echo

# 检查TypeScript编译
echo "3. 检查TypeScript编译..."
if command -v npx &> /dev/null; then
    cd ..
    npx tsc --noEmit 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✓ TypeScript编译通过"
    else
        echo "   ⚠  TypeScript编译有错误，请检查"
    fi
    cd e2e
else
    echo "   ⚠  未找到npx，跳过TypeScript检查"
fi

echo

# 运行测试（可选）
echo "4. 运行测试（可选）"
echo "   要运行任务分配测试，请执行:"
echo "   npx playwright test e2e/specs/task-assignment.spec.ts"
echo
echo "   要运行所有E2E测试，请执行:"
echo "   npx playwright test"
echo
echo "   要使用UI模式运行测试，请执行:"
echo "   npx playwright test --ui"

echo
echo "=== 验证完成 ==="
echo
echo "下一步:"
echo "1. 确保Supabase项目中有两个测试用户账号"
echo "2. 在.env文件中配置TEST_MEMBER_EMAIL"
echo "3. 运行测试验证功能"
echo "4. 查看测试报告和截图"