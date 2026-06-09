"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/events/Icon";

export function SignOutButton() {
  const router = useRouter();
  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <button type="button" className="admin-signout" onClick={signOut}>
      <Icon name="LogOut" size={16} /> Sign out
    </button>
  );
}
