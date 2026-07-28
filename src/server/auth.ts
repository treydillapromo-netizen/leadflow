import { sql } from "../db";
import { migrate } from "../db/schema";
import { randomUUID } from "crypto";

let migrated = false;
async function ensureMigrated() {
  if (!migrated) {
    try { await migrate(); } catch { /* ignore */ }
    migrated = true;
  }
}

// ── Password helpers ───────────────────────────────────────────────

/** Hash a password using Bun.password (bcrypt-compatible). */
async function hashPassword(pw: string): Promise<string> {
  return Bun.password.hash(pw, { algorithm: "bcrypt", cost: 10 });
}

/** Verify a password against a hash. */
async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return Bun.password.verify(pw, hash);
}

// ── Auth: Signup ───────────────────────────────────────────────────

export interface SignupInput {
  email: string;
  name?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  trial_start: string;
  trial_end: string;
  trial_leads_used: number;
  subscription_status: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  await ensureMigrated();
  const s = sql();

  // Validate
  if (!input.email || !input.password) {
    throw new Error("Email and password are required");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await hashPassword(input.password);
  const name = (input.name || input.email.split("@")[0]).trim();

  // Check if user exists
  const existing = await s`select id from users where email = ${input.email}` as Record<string, unknown>[];
  if (existing.length > 0) {
    throw new Error("A user with this email already exists");
  }

  // Create user
  const [user] = await s`
    insert into users (email, name, password_hash)
    values (${input.email}, ${name}, ${passwordHash})
    returning id, email, name, trial_start, trial_end, trial_leads_used, subscription_status, stripe_customer_id, created_at
  ` as Record<string, unknown>[];

  // Create session
  const token = randomUUID();
  await s`
    insert into sessions (user_id, token)
    values (${user.id as string}, ${token})
  `;

  return {
    user: serializeUser(user),
    token,
  };
}

// ── Auth: Login ────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  await ensureMigrated();
  const s = sql();

  const [user] = await s`
    select * from users where email = ${input.email}
  ` as Record<string, unknown>[];

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await verifyPassword(input.password, user.password_hash as string);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  // Create session
  const token = randomUUID();
  await s`
    insert into sessions (user_id, token)
    values (${user.id as string}, ${token})
  `;

  return {
    user: serializeUser(user),
    token,
  };
}

// ── Auth: Logout ────────────────────────────────────────────────────

export async function logout(token: string): Promise<void> {
  await ensureMigrated();
  const s = sql();
  await s`delete from sessions where token = ${token}`;
}

// ── Auth: Get current user from token ──────────────────────────────

export async function getSession(token: string): Promise<AuthUser | null> {
  await ensureMigrated();
  const s = sql();

  const [session] = await s`
    select user_id from sessions
    where token = ${token} and expires_at > now()
  ` as Record<string, unknown>[];

  if (!session) return null;

  const [user] = await s`
    select * from users where id = ${session.user_id as string}
  ` as Record<string, unknown>[];

  if (!user) return null;

  return serializeUser(user);
}

// ── Trial status ────────────────────────────────────────────────────

export interface TrialStatus {
  days_remaining: number;
  trial_active: boolean;
  leads_used: number;
  leads_limit: number;
  subscription_status: string;
}

export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  await ensureMigrated();
  const s = sql();

  const [user] = await s`
    select trial_start, trial_end, trial_leads_used, subscription_status
    from users where id = ${userId}
  ` as Record<string, unknown>[];

  if (!user) throw new Error("User not found");

  const trialEnd = new Date(user.trial_end as string);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    days_remaining: daysRemaining,
    trial_active: daysRemaining > 0 && (user.subscription_status as string) === "trial",
    leads_used: user.trial_leads_used as number,
    leads_limit: 50,
    subscription_status: user.subscription_status as string,
  };
}

// ── Lead cap check & increment ────────────────────────────────────

export async function checkLeadCap(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  await ensureMigrated();
  const s = sql();

  const [user] = await s`
    select subscription_status, trial_leads_used, trial_end
    from users where id = ${userId}
  ` as Record<string, unknown>[];

  if (!user) return { allowed: false, reason: "User not found" };

  const status = user.subscription_status as string;

  // Active subscribers: unlimited
  if (status === "active") return { allowed: true };

  // Cancelled or expired: no access
  if (status === "cancelled" || status === "expired") {
    return { allowed: false, reason: "Subscription is not active" };
  }

  // Trial: check days and lead cap
  const trialEnd = new Date(user.trial_end as string);
  if (new Date() > trialEnd) {
    return { allowed: false, reason: "Trial period has ended" };
  }

  const used = user.trial_leads_used as number;
  if (used >= 50) {
    return { allowed: false, reason: "Trial lead limit reached (50 leads)" };
  }

  return { allowed: true };
}

export async function incrementLeadCount(userId: string): Promise<number> {
  await ensureMigrated();
  const s = sql();

  const [row] = await s`
    update users set trial_leads_used = trial_leads_used + 1
    where id = ${userId}
    returning trial_leads_used
  ` as Record<string, unknown>[];

  return row.trial_leads_used as number;
}

// ── Convert to paid ────────────────────────────────────────────────

export async function convertToPaid(userId: string, stripeCustomerId: string): Promise<AuthUser> {
  await ensureMigrated();
  const s = sql();

  const [user] = await s`
    update users
    set subscription_status = 'active', stripe_customer_id = ${stripeCustomerId}
    where id = ${userId}
    returning *
  ` as Record<string, unknown>[];

  if (!user) throw new Error("User not found");
  return serializeUser(user);
}

// ── Helpers ────────────────────────────────────────────────────────

function serializeUser(row: Record<string, unknown>): AuthUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    trial_start: String(row.trial_start),
    trial_end: String(row.trial_end),
    trial_leads_used: row.trial_leads_used as number,
    subscription_status: row.subscription_status as string,
    stripe_customer_id: (row.stripe_customer_id as string) ?? null,
    created_at: String(row.created_at),
  };
}
