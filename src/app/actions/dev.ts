"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { revalidatePath } from "next/cache";

const TEST_USER_PREFIX = "test-user-";
const TEST_USER_DOMAIN = "poolify.test";
const FIXED_TEST_DOMAIN = "test.com";

const FIXED_TEST_USERS = [
  { username: "Juan",   email: "juan@test.com",   password: "juan" },
  { username: "Pedro",  email: "pedro@test.com",  password: "pedro" },
  { username: "Maria",  email: "maria@test.com",  password: "maria" },
  { username: "Luis",   email: "luis@test.com",   password: "luis" },
  { username: "Ana",    email: "ana@test.com",    password: "ana" },
];

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
      (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) ||
      u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
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
      (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) ||
      u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
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

export async function seedTestUsers() {
  await checkAuth();
  const admin = createAdminClient();

  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const existingEmails = new Set(allUsers.map((u) => u.email));

  const results: { email: string; status: "created" | "exists" | "error"; error?: string }[] = [];

  for (const u of FIXED_TEST_USERS) {
    if (existingEmails.has(u.email)) {
      results.push({ email: u.email, status: "exists" });
      continue;
    }

    const { data: { user }, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });

    if (error || !user) {
      results.push({ email: u.email, status: "error", error: error?.message });
      continue;
    }

    await admin.from("profiles").upsert({ id: user.id, username: u.username });
    results.push({ email: u.email, status: "created" });
  }

  revalidatePath("/dev-shell");
  return { success: true, results };
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

const SEED_CLAN_NAME = "Porra de prueba";

export async function seedDatabase() {
  await checkAuth();
  const admin = createAdminClient();

  // 1. Get test users
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const testUsers = allUsers.filter(
    (u) =>
      (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) ||
      u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
  );
  if (testUsers.length === 0) return { error: "No test users found. Run 'Seed users' first." };

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username")
    .in("id", testUsers.map((u) => u.id));

  const users = testUsers.map((u) => ({
    id: u.id,
    username: (profiles as { id: string; username: string }[])?.find((p) => p.id === u.id)?.username ?? "unknown",
  }));

  // 2. Find or create the test clan
  let clanId: string;
  const { data: existingClan } = await admin
    .from("clans")
    .select("id")
    .eq("name", SEED_CLAN_NAME)
    .single();

  if (existingClan) {
    clanId = existingClan.id;
    // Clear existing predictions for this clan to start fresh
    await admin.from("predictions").delete().eq("clan_id", clanId);
  } else {
    const { data: newClan, error: clanError } = await admin
      .from("clans")
      .insert({ name: SEED_CLAN_NAME, owner_id: users[0].id, invite_code: Math.random().toString(36).slice(2, 8).toUpperCase() })
      .select("id")
      .single();
    if (clanError || !newClan) return { error: `Failed to create clan: ${clanError?.message}` };
    clanId = newClan.id;
  }

  // 3. Add all test users to the clan (staggered join dates for tiebreaker testing)
  for (let i = 0; i < users.length; i++) {
    const joinedAt = new Date(Date.now() - (users.length - i) * 60_000).toISOString();
    await admin.from("clan_members").upsert(
      { user_id: users[i].id, clan_id: clanId, joined_at: joinedAt },
      { onConflict: "user_id,clan_id" },
    );
    // Set as default clan in profile
    await admin.from("profiles").update({ default_clan_id: clanId }).eq("id", users[i].id);
  }

  // 4. Get finished matches
  const { data: finishedMatches } = await admin
    .from("matches")
    .select("id, home_score, away_score")
    .eq("status", "finished")
    .order("match_date", { ascending: false })
    .limit(6);

  if (!finishedMatches || finishedMatches.length === 0) {
    return { error: "No finished matches found. Can't seed predictions." };
  }

  type FinishedMatch = { id: string; home_score: number; away_score: number };
  const matches = finishedMatches as FinishedMatch[];

  // 5. Build predictions: each user gets 3 matches, varied outcomes
  // Outcome patterns per user (cycling through matches):
  //   exact, exact, winner, miss, winner, miss...
  type Outcome = "exact" | "winner" | "miss";
  const OUTCOME_PATTERNS: Array<Outcome[]> = [
    ["exact",  "exact",  "winner", "miss",   "winner", "miss"],
    ["exact",  "winner", "winner", "exact",  "miss",   "winner"],
    ["winner", "exact",  "miss",   "winner", "exact",  "winner"],
    ["miss",   "winner", "exact",  "exact",  "winner", "miss"],
    ["winner", "miss",   "exact",  "winner", "exact",  "exact"],
  ];

  function makePred(match: FinishedMatch, outcome: Outcome) {
    const rh = match.home_score;
    const ra = match.away_score;
    if (outcome === "exact") return { home_score: rh, away_score: ra, points: 4 };
    if (outcome === "winner") {
      // Same sign but different score
      if (rh > ra) return { home_score: rh + 1, away_score: ra, points: 1 };
      if (ra > rh) return { home_score: rh, away_score: ra + 1, points: 1 };
      // Draw — flip to a non-draw (miss) since we can't easily do same-sign for draw
      return { home_score: rh + 1, away_score: ra + 1, points: 0 };
    }
    // miss: flip the result
    return { home_score: ra, away_score: rh + 1, points: 0 };
  }

  const predictions = [];
  for (let ui = 0; ui < users.length; ui++) {
    const pattern = OUTCOME_PATTERNS[ui % OUTCOME_PATTERNS.length];
    const matchCount = Math.min(3, matches.length);
    for (let mi = 0; mi < matchCount; mi++) {
      const match = matches[mi];
      const outcome = pattern[mi % pattern.length];
      const pred = makePred(match, outcome);
      predictions.push({
        user_id: users[ui].id,
        clan_id: clanId,
        match_id: match.id,
        ...pred,
      });
    }
  }

  const { error: predError } = await admin.from("predictions").upsert(predictions, {
    onConflict: "user_id,clan_id,match_id",
  });
  if (predError) return { error: `Predictions failed: ${predError.message}` };

  revalidatePath("/dev-shell");
  revalidatePath("/ranking");
  return {
    success: true,
    clanId,
    clanName: SEED_CLAN_NAME,
    users: users.length,
    predictions: predictions.length,
  };
}
