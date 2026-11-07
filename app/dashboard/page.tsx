"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { syncUserProfile } from "@/app/actions/authActions";

export default function DashboardDispatcher() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function routeUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // Sync & fetch accurate role and user_type from backend
        const res = await syncUserProfile({
          userId: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || null,
          phone: session.user.user_metadata?.phone || null,
        });

        if (!res.success || !res.profile) {
          setErrorMsg(res.error || "Failed to load account profile.");
          return;
        }

        const { role, user_type } = res.profile;

        // Admin role takes priority over any user_type
        if (role === "admin") {
          router.replace("/dashboard/admin");
          return;
        }

        // Route by user_type
        if (user_type === "student") {
          router.replace("/dashboard/student");
          return;
        }

        if (user_type === "institution") {
          router.replace("/dashboard/institution");
          return;
        }

        // If user_type is not selected yet, prompt onboarding
        router.replace("/onboarding");
      } catch (err: any) {
        console.error("Dashboard routing error:", err);
        setErrorMsg("Failed to connect. Please reload or sign in again.");
      }
    }

    routeUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      {errorMsg ? (
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 text-center shadow-lg">
          <p className="text-red-700 font-bold mb-2">Notice</p>
          <p className="text-sm text-ink/70 mb-4">{errorMsg}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-ink text-white rounded-lg text-xs font-bold"
          >
            Back to Sign In
          </a>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-ink border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink/75">Loading your dashboard...</p>
        </div>
      )}
    </div>
  );
}
