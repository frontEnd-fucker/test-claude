import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";

export default async function AuthCheck() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return null;
}
