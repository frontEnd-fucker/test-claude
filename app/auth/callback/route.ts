import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    console.error("Auth callback: No code parameter");
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=no_code`
    );
  }

  // 创建响应对象和Promise同步机制
  let response = NextResponse.redirect(requestUrl.origin);
  let setAllCompleted = false;
  let setAllPromiseResolve: (value: unknown) => void;
  const setAllPromise = new Promise((resolve) => {
    setAllPromiseResolve = resolve;
  });

  console.log("Auth callback: Starting OAuth flow with code:", code.substring(0, 10) + "...");

  // 使用与中间件相同的方式创建supabase客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // 从请求头解析cookie
          const cookieHeader = request.headers.get("cookie") || "";
          const cookies = cookieHeader.split(";").map((cookie) => {
            const trimmed = cookie.trim();
            const equalsIndex = trimmed.indexOf("=");
            if (equalsIndex === -1) {
              return { name: trimmed, value: "" };
            }
            const name = trimmed.substring(0, equalsIndex).trim();
            const value = trimmed.substring(equalsIndex + 1).trim();
            return { name, value };
          }).filter(c => c.name);

          console.log("Auth callback: getAll found cookies:", cookies.map(c => c.name));
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log("Auth callback: setAll called with", cookiesToSet.length, "cookies:",
            cookiesToSet.map(c => c.name));

          // 按照中间件的模式：先更新response对象
          response = NextResponse.redirect(requestUrl.origin);

          // 设置cookie到响应对象
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log(`Auth callback: Setting cookie ${name}=${value.substring(0, 10)}...`);
            response.cookies.set(name, value, options);
          });

          console.log("Auth callback: After setAll, response has cookies:",
            Array.from(response.cookies.getAll()).map(c => c.name));

          setAllCompleted = true;
          if (setAllPromiseResolve) {
            setAllPromiseResolve(null);
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  // 等待setAll完成（如果是异步调用的）
  await Promise.race([
    setAllPromise,
    new Promise(resolve => setTimeout(resolve, 100))
  ]);

  if (error) {
    console.error("Auth callback: Error exchanging code for session:", error.message);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=auth_callback_failed`
    );
  }

  console.log("Auth callback: Session exchange successful, user:", data?.user?.email);
  console.log("Auth callback: Final response cookies:",
    Array.from(response.cookies.getAll()).map(c => c.name));

  // 如果setAll没有被调用，记录警告
  if (!setAllCompleted) {
    console.warn("Auth callback: WARNING - setAll was never called!");
  }

  return response;
}
