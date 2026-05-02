"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { revalidatePath } from "next/cache";

const TEST_USER_PREFIX = "test-user-";
const TEST_USER_DOMAIN = "poolify.test";

// Helper to check if the current user is authorized to use dev tools
// ONLY ALLOWED IN LOCAL DEVELOPMENT
async function checkAuth() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "This functionality is only available in local development",
    );
  }
}

export async function getTestUsers() {
  await checkAuth();
  const admin = createAdminClient();

  const {
    data: { users },
    error,
  } = await admin.auth.admin.listUsers();
  if (error) throw error;

  const testUsers = users.filter(
    (u) =>
      u.email?.startsWith(TEST_USER_PREFIX) &&
      u.email?.endsWith(TEST_USER_DOMAIN),
  );

  // Get profiles for these users to get usernames
  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .in(
      "id",
      testUsers.map((u) => u.id),
    );

  return testUsers.map((u) => ({
    id: u.id,
    email: u.email,
    username:
      (profiles as Profile[])?.find((p) => p.id === u.id)?.username ||
      "unknown",
    created_at: u.created_at,
  }));
}

export async function createTestUser(username: string) {
  await checkAuth();
  const admin = createAdminClient();

  const email = `${TEST_USER_PREFIX}${username.toLowerCase()}@${TEST_USER_DOMAIN}`;
  const password = Math.random().toString(36).slice(-12);

  const {
    data: { user },
    error,
  } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return { error: error.message };

  // Manual profile creation to ensure the correct username is set
  // (The trigger might use the email part instead)
  if (user) {
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        username: username,
      });
    
    if (profileError) return { error: `User created but profile failed: ${profileError.message}` };
  }

  revalidatePath("/dev-shell");
  return { success: true, user };
}

export async function deleteTestUser(userId: string) {
  await checkAuth();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/dev-shell");
  return { success: true };
}

export async function deleteAllTestUsers() {
  await checkAuth();
  const admin = createAdminClient();

  const {
    data: { users },
    error: listError,
  } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const testUsers = users.filter(
    (u) =>
      u.email?.startsWith(TEST_USER_PREFIX) &&
      u.email?.endsWith(TEST_USER_DOMAIN),
  );

  for (const user of testUsers) {
    await admin.auth.admin.deleteUser(user.id);
  }

  revalidatePath("/dev-shell");
  return { success: true, count: testUsers.length };
}

export async function impersonateUser(userId: string) {
  await checkAuth();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await admin.auth.admin.getUserById(userId);
  if (userError || !user) throw new Error("User not found");

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email!,
    options: {
      redirectTo: "http://localhost:3000/dashboard",
    },
  });

  if (error) return { error: error.message };

  // Return the link so the client can redirect
  return { success: true, link: data.properties.action_link };
}

export async function getClans() {
  await checkAuth();
  const admin = createAdminClient();

  const { data, error } = await admin.from("clans").select("id, name");

  if (error) throw error;
  return data;
}

export async function addUserToClan(userId: string, clanId: string) {
  await checkAuth();
  const admin = createAdminClient();

  const { error } = await admin
    .from("clan_members")
    .insert({ user_id: userId, clan_id: clanId });

  if (error) return { error: error.message };

  revalidatePath("/dev-shell");
  return { success: true };
}
