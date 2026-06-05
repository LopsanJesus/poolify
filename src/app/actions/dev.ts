"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { readFileSync } from "fs";
import { join } from "path";

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

export async function resetAllData() {
  await checkAuth();
  const admin = createAdminClient();

  // Order matters: delete dependents before parents
  await admin.from("tournament_predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("tournament_results").delete().neq("clan_id", "00000000-0000-0000-0000-000000000000");
  await admin.from("predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("clan_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // clan_tournaments cascades on clan delete, but delete explicitly first for clarity
  await admin.from("clan_tournaments" as never).delete().neq("clan_id", "00000000-0000-0000-0000-000000000000");
  await admin.from("clans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("tournaments" as never).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Clear default_clan_id references in profiles (FK would be null from cascade but just in case)
  await admin.from("profiles").update({ default_clan_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");

  revalidatePath("/dev-shell");
  revalidatePath("/matches");
  revalidatePath("/ranking");
  return { success: true };
}

export async function deleteTestMatches() {
  await checkAuth();
  const admin = createAdminClient();
  const { error } = await admin.from("matches").delete().like("stage", "TEST%");
  if (error) return { error: error.message };
  revalidatePath("/dev-shell");
  revalidatePath("/matches");
  return { success: true };
}

// ── Shared helpers ────────────────────────────────────────────

async function getOrCreateTestClan(admin: ReturnType<typeof createAdminClient>, name: string, ownerId: string) {
  const { data: existing } = await admin.from("clans").select("id").eq("name", name).single();
  if (existing) {
    await admin.from("predictions").delete().eq("clan_id", existing.id);
    await admin.from("tournament_predictions").delete().eq("clan_id", existing.id);
    return existing.id as string;
  }
  const { data: newClan, error } = await admin
    .from("clans")
    .insert({ name, owner_id: ownerId, invite_code: Math.random().toString(36).slice(2, 10).toUpperCase() })
    .select("id").single();
  if (error || !newClan) throw new Error(error?.message ?? "clan creation failed");
  return newClan.id as string;
}

async function addMembersToClan(admin: ReturnType<typeof createAdminClient>, clanId: string, users: { id: string }[]) {
  for (let i = 0; i < users.length; i++) {
    const joinedAt = new Date(Date.now() - (users.length - i) * 60_000).toISOString();
    await admin.from("clan_members").upsert(
      { user_id: users[i].id, clan_id: clanId, joined_at: joinedAt },
      { onConflict: "user_id,clan_id" },
    );
    await admin.from("profiles").update({ default_clan_id: clanId }).eq("id", users[i].id);
  }
}

function makePrediction(match: { id: string; home_score: number; away_score: number }, outcome: "exact" | "winner" | "miss") {
  const rh = match.home_score;
  const ra = match.away_score;
  if (outcome === "exact") return { home_score: rh, away_score: ra, points: 4 };
  if (outcome === "winner") {
    if (rh > ra) return { home_score: rh + 1, away_score: ra, points: 1 };
    if (ra > rh) return { home_score: rh, away_score: ra + 1, points: 1 };
    return { home_score: rh + 1, away_score: ra + 1, points: 0 };
  }
  return { home_score: ra, away_score: rh + 1, points: 0 };
}

// ── Scenario: Tournament starts tomorrow ──────────────────────

export async function seedPreTournament() {
  await checkAuth();
  const admin = createAdminClient();

  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const testUsers = allUsers.filter(
    (u) => (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) || u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
  );
  if (testUsers.length === 0) return { error: "No test users. Run 'Seed users' first." };

  const { data: profiles } = await admin.from("profiles").select("id, username").in("id", testUsers.map((u) => u.id));
  const users = testUsers.map((u) => ({
    id: u.id,
    username: (profiles as { id: string; username: string }[])?.find((p) => p.id === u.id)?.username ?? "unknown",
  }));

  // Create 6 upcoming matches starting tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const MATCHES = [
    { home: "España",   away: "Alemania",    stage: "TEST Grupo A" },
    { home: "Francia",  away: "Portugal",    stage: "TEST Grupo B" },
    { home: "Brasil",   away: "Argentina",   stage: "TEST Grupo C" },
    { home: "Marruecos",away: "Senegal",     stage: "TEST Grupo D" },
    { home: "Japón",    away: "Corea del Sur",stage:"TEST Grupo E" },
    { home: "México",   away: "Uruguay",     stage: "TEST Grupo F" },
  ];

  const matchRows = MATCHES.map((m, i) => ({
    home_team: m.home,
    away_team: m.away,
    match_date: new Date(tomorrow.getTime() + i * 2 * 60 * 60 * 1000).toISOString(),
    stage: m.stage,
    status: "upcoming" as const,
  }));

  const { data: createdMatches, error: matchErr } = await admin.from("matches").insert(matchRows).select("id");
  if (matchErr || !createdMatches) return { error: `Matches: ${matchErr?.message}` };

  const clanId = await getOrCreateTestClan(admin, "Porra pre-torneo", users[0].id);
  await addMembersToClan(admin, clanId, users);

  revalidatePath("/dev-shell");
  revalidatePath("/matches");
  return { success: true, clanId, clanName: "Porra pre-torneo", matches: createdMatches.length, users: users.length };
}

// ── Scenario: Tournament in progress ─────────────────────────

export async function seedInProgress() {
  await checkAuth();
  const admin = createAdminClient();

  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const testUsers = allUsers.filter(
    (u) => (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) || u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
  );
  if (testUsers.length === 0) return { error: "No test users. Run 'Seed users' first." };

  const { data: profiles } = await admin.from("profiles").select("id, username").in("id", testUsers.map((u) => u.id));
  const users = testUsers.map((u) => ({
    id: u.id,
    username: (profiles as { id: string; username: string }[])?.find((p) => p.id === u.id)?.username ?? "unknown",
  }));

  const now = new Date();
  const daysAgo = (d: number, h = 15) => { const t = new Date(now); t.setDate(t.getDate() - d); t.setHours(h, 0, 0, 0); return t.toISOString(); };
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

  const FINISHED = [
    { home: "España",    away: "Alemania",     home_score: 2, away_score: 1, date: daysAgo(3), stage: "TEST Grupo A" },
    { home: "Francia",   away: "Portugal",     home_score: 0, away_score: 0, date: daysAgo(2), stage: "TEST Grupo B" },
    { home: "Brasil",    away: "Argentina",    home_score: 1, away_score: 3, date: daysAgo(1), stage: "TEST Grupo C" },
  ];
  const LIVE = [
    { home: "Marruecos", away: "Senegal",      date: hoursAgo(1), stage: "TEST Grupo D" },
  ];
  const UPCOMING = [
    { home: "Japón",     away: "Corea del Sur",date: hoursFromNow(4),  stage: "TEST Grupo E" },
    { home: "México",    away: "Uruguay",      date: hoursFromNow(28), stage: "TEST Grupo F" },
    { home: "Inglaterra",away: "Italia",       date: hoursFromNow(52), stage: "TEST Grupo G" },
  ];

  const rows = [
    ...FINISHED.map((m) => ({ home_team: m.home, away_team: m.away, match_date: m.date, stage: m.stage, status: "finished" as const, home_score: m.home_score, away_score: m.away_score })),
    ...LIVE.map((m)     => ({ home_team: m.home, away_team: m.away, match_date: m.date, stage: m.stage, status: "live" as const })),
    ...UPCOMING.map((m) => ({ home_team: m.home, away_team: m.away, match_date: m.date, stage: m.stage, status: "upcoming" as const })),
  ];

  const { data: createdMatches, error: matchErr } = await admin.from("matches").insert(rows).select("id, home_score, away_score, status");
  if (matchErr || !createdMatches) return { error: `Matches: ${matchErr?.message}` };

  const clanId = await getOrCreateTestClan(admin, "Porra en juego", users[0].id);
  await addMembersToClan(admin, clanId, users);

  // Seed predictions for finished matches
  type CreatedMatch = { id: string; home_score: number | null; away_score: number | null; status: string };
  const finishedCreated = (createdMatches as CreatedMatch[]).filter((m) => m.status === "finished") as { id: string; home_score: number; away_score: number }[];

  const OUTCOME_PATTERNS: Array<Array<"exact" | "winner" | "miss">> = [
    ["exact", "exact",  "winner"],
    ["exact", "winner", "exact"],
    ["winner","exact",  "miss"],
    ["miss",  "winner", "exact"],
    ["winner","miss",   "exact"],
  ];

  const predictions = [];
  for (let ui = 0; ui < users.length; ui++) {
    const pattern = OUTCOME_PATTERNS[ui % OUTCOME_PATTERNS.length];
    for (let mi = 0; mi < finishedCreated.length; mi++) {
      const pred = makePrediction(finishedCreated[mi], pattern[mi % pattern.length]);
      predictions.push({ user_id: users[ui].id, clan_id: clanId, match_id: finishedCreated[mi].id, ...pred });
    }
  }

  const { error: predErr } = await admin.from("predictions").upsert(predictions, { onConflict: "user_id,clan_id,match_id" });
  if (predErr) return { error: `Predictions: ${predErr.message}` };

  revalidatePath("/dev-shell");
  revalidatePath("/matches");
  revalidatePath("/ranking");
  return { success: true, clanId, clanName: "Porra en juego", matches: createdMatches.length, predictions: predictions.length, users: users.length };
}

// ── Helper: subscribe a clan to a tournament ──────────────────

async function subscribeClanToTournament(
  admin: ReturnType<typeof createAdminClient>,
  clanId: string,
  tournamentId: string,
) {
  await (admin as any)
    .from("clan_tournaments")
    .upsert({ clan_id: clanId, tournament_id: tournamentId }, { onConflict: "clan_id,tournament_id" });
}

// ── Helper: convert WC JSON time to UTC ISO string ────────────
// Input: date "2026-06-11", time "13:00 UTC-6"
// Madrid summer = UTC+2 → stored UTC = local time - UTC offset
function wcTimeToISO(date: string, time: string): string {
  const m = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!m) throw new Error(`Bad time format: ${time}`);
  const h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const offset = parseInt(m[3]); // e.g. -6
  // UTC hours = local hours - offset (since local = UTC + offset)
  const utcMs = Date.UTC(
    parseInt(date.slice(0, 4)),
    parseInt(date.slice(5, 7)) - 1,
    parseInt(date.slice(8, 10)),
    h - offset,
    min,
  );
  return new Date(utcMs).toISOString();
}

// ── Scenario: Fake World Cup in progress ──────────────────────

export async function seedFakeWorldCup() {
  await checkAuth();
  const admin = createAdminClient();

  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const testUsers = allUsers.filter(
    (u) => (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) || u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
  );
  if (testUsers.length === 0) return { error: "No test users. Run 'Seed users' first." };

  const { data: profiles } = await admin.from("profiles").select("id, username").in("id", testUsers.map((u) => u.id));
  const users = testUsers.map((u) => ({
    id: u.id,
    username: (profiles as { id: string; username: string }[])?.find((p) => p.id === u.id)?.username ?? "unknown",
  }));

  // Create or reuse tournament
  let tournamentId: string;
  const { data: existingT } = await (admin as any).from("tournaments").select("id").eq("name", "Mundial Fake 2026").single();
  if (existingT) {
    tournamentId = (existingT as { id: string }).id;
    await admin.from("matches").delete().eq("tournament_id" as never, tournamentId);
  } else {
    const { data: newT, error: tErr } = await (admin as any)
      .from("tournaments")
      .insert({ name: "Mundial Fake 2026", status: "in_progress" })
      .select("id").single();
    if (tErr || !newT) return { error: `Tournament: ${tErr?.message}` };
    tournamentId = (newT as { id: string }).id;
  }

  const now = new Date();
  const daysAgo = (d: number, h = 15) => { const t = new Date(now); t.setDate(t.getDate() - d); t.setHours(h, 0, 0, 0); return t.toISOString(); };
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

  const FINISHED = [
    { home: "España",    away: "Alemania",     home_score: 2, away_score: 1, date: daysAgo(3), stage: "Grupo A" },
    { home: "Francia",   away: "Portugal",     home_score: 0, away_score: 0, date: daysAgo(2), stage: "Grupo B" },
    { home: "Brasil",    away: "Argentina",    home_score: 1, away_score: 3, date: daysAgo(1), stage: "Grupo C" },
  ];
  const LIVE = [
    { home: "Marruecos", away: "Senegal",      date: hoursAgo(1), stage: "Grupo D" },
  ];
  const UPCOMING = [
    { home: "Japón",     away: "Corea del Sur",date: hoursFromNow(4),  stage: "Grupo E" },
    { home: "México",    away: "Uruguay",      date: hoursFromNow(28), stage: "Grupo F" },
    { home: "Inglaterra",away: "Italia",       date: hoursFromNow(52), stage: "Grupo G" },
  ];

  const rows = [
    ...FINISHED.map((m) => ({ home_team: m.home, away_team: m.away, match_date: m.date, stage: m.stage, status: "finished" as const, home_score: m.home_score, away_score: m.away_score, tournament_id: tournamentId })),
    ...LIVE.map((m)     => ({ home_team: m.home, away_team: m.away, match_date: m.date, stage: m.stage, status: "live" as const, tournament_id: tournamentId })),
    ...UPCOMING.map((m) => ({ home_team: m.home, away_team: m.away, match_date: m.date, stage: m.stage, status: "upcoming" as const, tournament_id: tournamentId })),
  ];

  const { data: createdMatches, error: matchErr } = await admin.from("matches").insert(rows as never[]).select("id, home_score, away_score, status");
  if (matchErr || !createdMatches) return { error: `Matches: ${matchErr?.message}` };

  const clanId = await getOrCreateTestClan(admin, "Porra Fake en Juego", users[0].id);
  await addMembersToClan(admin, clanId, users);
  await subscribeClanToTournament(admin, clanId, tournamentId);

  type CreatedMatch = { id: string; home_score: number | null; away_score: number | null; status: string };
  const finishedCreated = (createdMatches as CreatedMatch[]).filter((m) => m.status === "finished") as { id: string; home_score: number; away_score: number }[];

  const OUTCOME_PATTERNS: Array<Array<"exact" | "winner" | "miss">> = [
    ["exact", "exact",  "winner"],
    ["exact", "winner", "exact"],
    ["winner","exact",  "miss"],
    ["miss",  "winner", "exact"],
    ["winner","miss",   "exact"],
  ];

  const predictions = [];
  for (let ui = 0; ui < users.length; ui++) {
    const pattern = OUTCOME_PATTERNS[ui % OUTCOME_PATTERNS.length];
    for (let mi = 0; mi < finishedCreated.length; mi++) {
      const pred = makePrediction(finishedCreated[mi], pattern[mi % pattern.length]);
      predictions.push({ user_id: users[ui].id, clan_id: clanId, match_id: finishedCreated[mi].id, ...pred });
    }
  }

  const { error: predErr } = await admin.from("predictions").upsert(predictions, { onConflict: "user_id,clan_id,match_id" });
  if (predErr) return { error: `Predictions: ${predErr.message}` };

  revalidatePath("/dev-shell");
  revalidatePath("/matches");
  revalidatePath("/ranking");
  return { success: true, clanId, clanName: "Porra Fake en Juego", matches: createdMatches.length, predictions: predictions.length, users: users.length };
}

// ── Scenario: Real World Cup 2026 ────────────────────────────

export async function seedRealWorldCup() {
  await checkAuth();
  const admin = createAdminClient();

  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const testUsers = allUsers.filter(
    (u) => (u.email?.startsWith(TEST_USER_PREFIX) && u.email?.endsWith(TEST_USER_DOMAIN)) || u.email?.endsWith(`@${FIXED_TEST_DOMAIN}`),
  );
  if (testUsers.length === 0) return { error: "No test users. Run 'Seed users' first." };

  const { data: profiles } = await admin.from("profiles").select("id, username").in("id", testUsers.map((u) => u.id));
  const users = testUsers.map((u) => ({
    id: u.id,
    username: (profiles as { id: string; username: string }[])?.find((p) => p.id === u.id)?.username ?? "unknown",
  }));

  // Create or reuse tournament
  let tournamentId: string;
  const { data: existingT } = await (admin as any).from("tournaments").select("id").eq("name", "World Cup 2026").single();
  if (existingT) {
    tournamentId = (existingT as { id: string }).id;
    await admin.from("matches").delete().eq("tournament_id" as never, tournamentId);
  } else {
    const { data: newT, error: tErr } = await (admin as any)
      .from("tournaments")
      .insert({ name: "World Cup 2026", status: "upcoming" })
      .select("id").single();
    if (tErr || !newT) return { error: `Tournament: ${tErr?.message}` };
    tournamentId = (newT as { id: string }).id;
  }

  // Read and parse worldcup_games.json from project root
  const wcJson = JSON.parse(readFileSync(join(process.cwd(), "worldcup_games.json"), "utf-8")) as {
    matches: Array<{
      round: string; date: string; time: string;
      team1: string; team2: string;
      group?: string; ground?: string; num?: number;
    }>;
  };

  // Only group stage matches (those with a real group field)
  const groupMatches = wcJson.matches.filter((m) => m.group != null);

  const matchRows = groupMatches.map((m) => ({
    home_team: m.team1,
    away_team: m.team2,
    match_date: wcTimeToISO(m.date, m.time),
    stage: `${m.group} – ${m.round}`,
    status: "upcoming" as const,
    tournament_id: tournamentId,
  }));

  const { data: createdMatches, error: matchErr } = await admin.from("matches").insert(matchRows as never[]).select("id");
  if (matchErr || !createdMatches) return { error: `Matches: ${matchErr?.message}` };

  const clanId = await getOrCreateTestClan(admin, "Porra Mundial Real 2026", users[0].id);
  await addMembersToClan(admin, clanId, users);
  await subscribeClanToTournament(admin, clanId, tournamentId);

  revalidatePath("/dev-shell");
  revalidatePath("/matches");
  return { success: true, clanId, clanName: "Porra Mundial Real 2026", matches: createdMatches.length, users: users.length };
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
