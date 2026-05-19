import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import type {
  AdminOverview,
  AdminUserSummary,
  AppUser,
  CurrentUserResponse,
  SubscriptionPlan,
  UsageSummary,
  UserRole,
} from '@/types';

const AUTH_COOKIE = 'ac_session';
const SESSION_DAYS = 30;

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 12,
  pro: 120,
  team: 400,
};

function nowIso() {
  return new Date().toISOString();
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(':');
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function ensureAuthSchema() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      plan TEXT NOT NULL,
      monthly_limit INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_usage_user_created ON usage_events(user_id, created_at);
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count === 0) {
    seedUsers();
  }
}

function seedUsers() {
  const db = getDB();
  const createdAt = nowIso();
  const users = [
    {
      id: 'user-free',
      email: 'free@teachercopilot.local',
      name: 'Free Teacher',
      role: 'user' as UserRole,
      plan: 'free' as SubscriptionPlan,
      monthlyLimit: PLAN_LIMITS.free,
      password: 'Free123!',
    },
    {
      id: 'user-pro',
      email: 'pro@teachercopilot.local',
      name: 'Pro Teacher',
      role: 'user' as UserRole,
      plan: 'pro' as SubscriptionPlan,
      monthlyLimit: PLAN_LIMITS.pro,
      password: 'Pro123!',
    },
    {
      id: 'user-admin',
      email: 'admin@teachercopilot.local',
      name: 'Admin',
      role: 'admin' as UserRole,
      plan: 'team' as SubscriptionPlan,
      monthlyLimit: PLAN_LIMITS.team,
      password: 'Admin123!',
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, role, plan, monthly_limit, password_hash, created_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    stmt.run(
      user.id,
      user.email,
      user.name,
      user.role,
      user.plan,
      user.monthlyLimit,
      hashPassword(user.password),
      createdAt,
      null
    );
  }
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: SubscriptionPlan;
  monthly_limit: number;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
};

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    plan: row.plan,
    monthlyLimit: row.monthly_limit,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
  };
}

export function getPlanLimit(plan: SubscriptionPlan) {
  return PLAN_LIMITS[plan];
}

export function ensureAuth() {
  ensureAuthSchema();
}

export function getUserByEmail(email: string) {
  ensureAuthSchema();
  const db = getDB();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserById(id: string) {
  ensureAuthSchema();
  const db = getDB();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function authenticateUser(email: string, password: string) {
  const dbUser = getUserByEmail(email);
  if (!dbUser?.passwordHash) return null;
  if (!verifyPassword(password, dbUser.passwordHash)) return null;
  return dbUser;
}

export function updateLastLogin(userId: string) {
  ensureAuthSchema();
  getDB().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), userId);
}

export function createSession(userId: string) {
  ensureAuthSchema();
  const db = getDB();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const id = `session-${crypto.randomUUID()}`;

  db.prepare(`
    INSERT INTO sessions (id, user_id, token, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, token, nowIso(), expiresAt);

  return { id, token, expiresAt };
}

export function getUserFromToken(token: string) {
  ensureAuthSchema();
  const db = getDB();
  const row = db.prepare(`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ?
    LIMIT 1
  `).get(token, nowIso()) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function deleteSession(token: string) {
  ensureAuthSchema();
  getDB().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, getSessionCookieOptions());
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, '', { ...getSessionCookieOptions(), maxAge: 0 });
  return response;
}

export function getSessionTokenFromRequest(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE)?.value || null;
}

export function getCurrentUserFromRequest(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return getUserFromToken(token);
}

export function getUsageSummary(userId: string): UsageSummary {
  ensureAuthSchema();
  const db = getDB();
  const currentMonth = monthKey();
  const used = (db.prepare(`
    SELECT COUNT(*) as count
    FROM usage_events
    WHERE user_id = ? AND substr(created_at, 1, 7) = ?
  `).get(userId, currentMonth) as { count: number }).count;

  const user = getUserById(userId);
  const limit = user?.monthlyLimit ?? PLAN_LIMITS.free;
  return {
    month: currentMonth,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}

export function assertUsageAllowance(userId: string, action: string) {
  const summary = getUsageSummary(userId);
  const user = getUserById(userId);
  if (!user) {
    return { ok: false, reason: '用户不存在' };
  }

  if (user.role === 'admin') {
    return { ok: true, summary };
  }

  if (summary.remaining <= 0) {
    return { ok: false, reason: `${action} 本月额度已用完` };
  }

  return { ok: true, summary };
}

export function recordUsage(userId: string, action: string, metadata?: Record<string, unknown>) {
  ensureAuthSchema();
  const db = getDB();
  const id = `usage-${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO usage_events (id, user_id, action, metadata, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, action, metadata ? JSON.stringify(metadata) : null, nowIso());
  return id;
}

export function getCurrentUserProfile(userId: string): CurrentUserResponse | null {
  const user = getUserById(userId);
  if (!user) return null;
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    monthlyLimit: user.monthlyLimit,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
  return {
    user: safeUser,
    usage: getUsageSummary(userId),
  };
}

export function listAdminUsers(): AdminUserSummary[] {
  ensureAuthSchema();
  const db = getDB();
  const rows = db.prepare(`
    SELECT id, email, name, role, plan, monthly_limit, created_at, last_login_at
    FROM users
    ORDER BY created_at DESC
  `).all() as Array<Pick<UserRow, 'id' | 'email' | 'name' | 'role' | 'plan' | 'monthly_limit' | 'created_at' | 'last_login_at'>>;

  return rows.map((row) => {
    const usedThisMonth = (db.prepare(`
      SELECT COUNT(*) as count
      FROM usage_events
      WHERE user_id = ? AND substr(created_at, 1, 7) = ?
    `).get(row.id, monthKey()) as { count: number }).count;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      plan: row.plan,
      monthlyLimit: row.monthly_limit,
      usedThisMonth,
      remainingThisMonth: Math.max(row.monthly_limit - usedThisMonth, 0),
      createdAt: new Date(row.created_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    };
  });
}

export function getAdminOverview(): AdminOverview {
  const users = listAdminUsers();
  return {
    users,
    stats: {
      totalUsers: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      activePlans: {
        free: users.filter((user) => user.plan === 'free').length,
        pro: users.filter((user) => user.plan === 'pro').length,
        team: users.filter((user) => user.plan === 'team').length,
      },
      totalUsageThisMonth: users.reduce((sum, user) => sum + user.usedThisMonth, 0),
    },
  };
}

export function updateUserPlan(userId: string, plan: SubscriptionPlan, role?: UserRole) {
  ensureAuthSchema();
  const db = getDB();
  db.prepare('UPDATE users SET plan = ?, monthly_limit = ?, role = COALESCE(?, role) WHERE id = ?').run(
    plan,
    PLAN_LIMITS[plan],
    role || null,
    userId
  );
  return getUserById(userId);
}

export function listPlanOptions() {
  return [
    { value: 'free' as const, label: 'Free', limit: PLAN_LIMITS.free, feature: '适合试用与体验' },
    { value: 'pro' as const, label: 'Pro', limit: PLAN_LIMITS.pro, feature: '适合个人教师高频使用' },
    { value: 'team' as const, label: 'Team', limit: PLAN_LIMITS.team, feature: '适合教研组与校内共享' },
  ];
}
