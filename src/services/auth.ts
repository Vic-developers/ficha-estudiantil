import { supabase } from "@/lib/supabase";
import type { AuthUser, Profile, UserRole } from "@/types";

export interface SignUpResult {
  error: string | null;
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<SignUpResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) return { error: error.message };

  return {
    error: null,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export function toAuthUser(
  profile: Profile | null,
  email: string | undefined
): AuthUser | null {
  if (!profile) return null;
  return {
    id: profile.id,
    email: email ?? "",
    name: profile.name,
    role: profile.role,
  };
}

export async function updateOwnProfileName(userId: string, name: string) {
  return supabase.from("profiles").update({ name }).eq("id", userId);
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  return { error: error?.message ?? null };
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): Promise<{ error: string | null; userId: string | null }> {
  const { data, error } = await supabase.rpc("admin_create_user", {
    p_email: input.email,
    p_password: input.password,
    p_name: input.name,
    p_role: input.role,
  });

  if (error) return { error: error.message, userId: null };
  return { error: null, userId: (data as string) ?? null };
}