/**
 * 根据环境获取Supabase配置
 * 开发环境自动使用本地Supabase
 */
export const getSupabaseConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 开发环境使用本地Supabase
  if (isDevelopment) {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      // 本地 Supabase 的默认 service role key
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.ymB8e2QY7S7M52e9w9Hj7g',
    };
  }

  // 生产环境使用云端Supabase
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
};