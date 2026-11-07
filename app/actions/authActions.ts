"use server";

import { supabaseAdmin, isAdminEmail } from "@/lib/supabaseAdmin";

export type UserRole = "admin" | "user";
export type UserType = "student" | "institution";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  user_type: UserType | null;
  account_status: "active" | "suspended";
  created_at: string;
  last_login_at: string | null;
};

/**
 * Log administrative or system activity
 */
export async function logActivity(params: {
  actor_id?: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: "lead" | "user" | "system";
  entity_id?: string | null;
  details?: Record<string, any> | null;
}) {
  try {
    await supabaseAdmin.from("activity_logs").insert([
      {
        actor_id: params.actor_id || null,
        actor_name: params.actor_name || null,
        actor_email: params.actor_email || null,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id || null,
        details: params.details || null,
      },
    ]);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

/**
 * Sync user profile securely upon registration or login.
 * Roles are NEVER set from client input:
 * only emails in ADMIN_EMAILS get the 'admin' role.
 */
export async function syncUserProfile(params: {
  userId: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  userType?: UserType | null;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const { userId, email, fullName, phone, userType } = params;
    const cleanEmail = email.trim().toLowerCase();

    // Securely determine role: ONLY backend ADMIN_EMAILS check
    const role: UserRole = isAdminEmail(cleanEmail) ? "admin" : "user";

    // Check if profile already exists
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error fetching profile:", fetchErr);
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing profile
      const updatedUserType = existing.user_type || userType || null;
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          email: cleanEmail,
          full_name: fullName || existing.full_name,
          phone: phone || existing.phone,
          role, // Always enforced by server
          user_type: updatedUserType,
          last_login_at: now,
          updated_at: now,
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      return { success: true, profile: updated as UserProfile };
    } else {
      // Insert new profile
      const newProfile = {
        id: userId,
        email: cleanEmail,
        full_name: fullName || null,
        phone: phone || null,
        role,
        user_type: userType || null,
        account_status: "active",
        created_at: now,
        updated_at: now,
        last_login_at: now,
      };

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }

      // Log registration activity
      await logActivity({
        actor_id: userId,
        actor_name: fullName || cleanEmail.split("@")[0],
        actor_email: cleanEmail,
        action: "user_registered",
        entity_type: "user",
        entity_id: userId,
        details: {
          role,
          user_type: userType || "unassigned",
        },
      });

      return { success: true, profile: inserted as UserProfile };
    }
  } catch (err: any) {
    console.error("syncUserProfile unexpected error:", err);
    return { success: false, error: err?.message || "Profile sync failed" };
  }
}

/**
 * Get profile for a given user id
 */
export async function getUserProfile(
  userId: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Profile not found" };
    }

    return { success: true, profile: data as UserProfile };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch profile" };
  }
}

/**
 * Update user type during onboarding (if unassigned)
 */
export async function updateUserType(
  userId: string,
  userType: UserType
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!["student", "institution"].includes(userType)) {
      return { success: false, error: "Invalid user type" };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        user_type: userType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      actor_id: userId,
      action: "user_type_selected",
      entity_type: "user",
      entity_id: userId,
      details: { user_type: userType },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update user type" };
  }
}
