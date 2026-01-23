import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=no_code`
    );
  }

  // 创建响应对象
  let response = NextResponse.redirect(requestUrl.origin);

  // 使用与中间件相同的方式创建supabase客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // 从请求头解析cookie
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader.split(";").map((cookie) => {
            const trimmed = cookie.trim();
            const equalsIndex = trimmed.indexOf("=");
            if (equalsIndex === -1) {
              return { name: trimmed, value: "" };
            }
            const name = trimmed.substring(0, equalsIndex).trim();
            const value = trimmed.substring(equalsIndex + 1).trim();
            return { name, value };
          }).filter(c => c.name);
        },
        setAll(cookiesToSet) {
          // 设置cookie到响应对象
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=auth_callback_failed`
    );
  }

  return response;
}
