/**
 * 数据库配置和操作
 * 使用 SQLite 存储教案、题目和质量检查记录
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { LessonPlan, Question, QualityCheck, HistoryItem, LessonContent } from '@/types';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'teacher-copilot.db');

// 数据库连接单例
let db: Database.Database | null = null;

type LessonPlanListRow = {
  id: string;
  grade: string;
  subject: string;
  textbook: string | null;
  topic: string;
  created_at: string;
  question_count: number;
  quality_checked: number;
};

type LessonPlanRow = {
  id: string;
  grade: string;
  subject: string;
  textbook: string | null;
  topic: string;
  objectives: string;
  duration: number;
  content: string;
  created_at: string;
  updated_at: string;
};

type QuestionRow = {
  id: string;
  lesson_plan_id: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  content: string;
  options: string | null;
  answer: string;
  explanation: string;
  knowledge_point: string | null;
};

type CountRow = {
  count: number;
};

type QualityCheckRow = {
  id: string;
  lesson_plan_id: string;
  coverage_score: number;
  difficulty_distribution: string;
  type_distribution: string;
  issues: string;
  summary: string;
  created_at: string;
};

/**
 * 获取数据库连接
 */
export function getDB(): Database.Database {
  if (!db) {
    // 确保 data 目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDB();
  }
  return db;
}

/**
 * 初始化数据库表结构
 */
function initDB(): void {
  const db = getDB();

  // 教案表
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_plans (
      id TEXT PRIMARY KEY,
      grade TEXT NOT NULL,
      subject TEXT NOT NULL,
      textbook TEXT,
      topic TEXT NOT NULL,
      objectives TEXT NOT NULL,
      duration INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 题目表
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      lesson_plan_id TEXT NOT NULL,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      content TEXT NOT NULL,
      options TEXT,
      answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      knowledge_point TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
    )
  `);

  // 质量检查表
  db.exec(`
    CREATE TABLE IF NOT EXISTS quality_checks (
      id TEXT PRIMARY KEY,
      lesson_plan_id TEXT NOT NULL,
      coverage_score REAL NOT NULL,
      difficulty_distribution TEXT NOT NULL,
      type_distribution TEXT NOT NULL,
      issues TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_questions_lesson_plan ON questions(lesson_plan_id);
    CREATE INDEX IF NOT EXISTS idx_quality_checks_lesson_plan ON quality_checks(lesson_plan_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_plans_created ON lesson_plans(created_at DESC);
  `);

  ensureColumn(db, 'lesson_plans', 'textbook', 'TEXT');
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== 教案操作 ====================

/**
 * 保存教案
 */
export function saveLessonPlan(lesson: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>): LessonPlan {
  const db = getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO lesson_plans (id, grade, subject, textbook, topic, objectives, duration, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    lesson.grade,
    lesson.subject,
    lesson.textbook || null,
    lesson.topic,
    lesson.objectives,
    lesson.duration,
    JSON.stringify(lesson.content),
    now,
    now
  );

  return {
    ...lesson,
    id,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

/**
 * 获取教案列表
 */
export function getLessonPlans(limit: number = 20, offset: number = 0): HistoryItem[] {
  const db = getDB();

  const stmt = db.prepare(`
    SELECT
      lp.id,
      lp.grade,
      lp.subject,
      lp.textbook,
      lp.topic,
      lp.created_at,
      COUNT(DISTINCT q.id) as question_count,
      CASE WHEN qc.id IS NOT NULL THEN 1 ELSE 0 END as quality_checked
    FROM lesson_plans lp
    LEFT JOIN questions q ON q.lesson_plan_id = lp.id
    LEFT JOIN quality_checks qc ON qc.lesson_plan_id = lp.id
    GROUP BY lp.id
    ORDER BY lp.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = stmt.all(limit, offset) as LessonPlanListRow[];

  return rows.map(row => ({
    id: row.id,
    grade: row.grade,
    subject: row.subject,
    textbook: row.textbook || undefined,
    topic: row.topic,
    createdAt: new Date(row.created_at),
    questionCount: row.question_count || 0,
    qualityChecked: row.quality_checked === 1,
  }));
}

/**
 * 根据 ID 获取教案
 */
export function getLessonPlanById(id: string): LessonPlan | null {
  const db = getDB();

  const stmt = db.prepare('SELECT * FROM lesson_plans WHERE id = ?');
  const row = stmt.get(id) as LessonPlanRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    grade: row.grade,
    subject: row.subject,
    textbook: row.textbook || undefined,
    topic: row.topic,
    objectives: row.objectives,
    duration: row.duration,
    content: JSON.parse(row.content) as LessonContent,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 更新教案
 */
export function updateLessonPlan(id: string, updates: Partial<Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>>): LessonPlan | null {
  const db = getDB();

  const existing = getLessonPlanById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(JSON.stringify(updates.content));
  }
  if (updates.topic !== undefined) {
    fields.push('topic = ?');
    values.push(updates.topic);
  }
  if (updates.textbook !== undefined) {
    fields.push('textbook = ?');
    values.push(updates.textbook);
  }
  if (updates.objectives !== undefined) {
    fields.push('objectives = ?');
    values.push(updates.objectives);
  }
  if (updates.duration !== undefined) {
    fields.push('duration = ?');
    values.push(updates.duration);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE lesson_plans SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getLessonPlanById(id);
}

/**
 * 删除教案
 */
export function deleteLessonPlan(id: string): boolean {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM lesson_plans WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 获取教案总数
 */
export function getLessonPlansCount(): number {
  const db = getDB();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM lesson_plans');
  const result = stmt.get() as CountRow | undefined;
  return result?.count ?? 0;
}

// ==================== 题目操作 ====================

/**
 * 保存题目列表
 */
export function saveQuestions(questions: Omit<Question, 'id'>[]): Question[] {
  const db = getDB();

  const savedQuestions: Question[] = [];

  for (const q of questions) {
    const id = generateId();

    const stmt = db.prepare(`
      INSERT INTO questions (id, lesson_plan_id, type, difficulty, content, options, answer, explanation, knowledge_point)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      q.lessonPlanId,
      q.type,
      q.difficulty,
      q.content,
      q.options ? JSON.stringify(q.options) : null,
      q.answer,
      q.explanation,
      q.knowledgePoint || null
    );

    savedQuestions.push({ ...q, id });
  }

  return savedQuestions;
}

/**
 * 获取教案关联的题目
 */
export function getQuestionsByLessonId(lessonId: string): Question[] {
  const db = getDB();

  const stmt = db.prepare('SELECT * FROM questions WHERE lesson_plan_id = ? ORDER BY type, difficulty');
  const rows = stmt.all(lessonId) as QuestionRow[];

  return rows.map(row => ({
    id: row.id,
    lessonPlanId: row.lesson_plan_id,
    type: row.type,
    difficulty: row.difficulty,
    content: row.content,
    options: row.options ? JSON.parse(row.options) : undefined,
    answer: row.answer,
    explanation: row.explanation,
    knowledgePoint: row.knowledge_point || undefined,
  }));
}

/**
 * 删除教案关联的所有题目
 */
export function deleteQuestionsByLessonId(lessonId: string): number {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM questions WHERE lesson_plan_id = ?');
  const result = stmt.run(lessonId);
  return result.changes;
}

// ==================== 质量检查操作 ====================

/**
 * 保存质量检查结果
 */
export function saveQualityCheck(check: Omit<QualityCheck, 'id' | 'createdAt'>): QualityCheck {
  const db = getDB();
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO quality_checks (id, lesson_plan_id, coverage_score, difficulty_distribution, type_distribution, issues, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    check.lessonPlanId,
    check.coverageScore,
    JSON.stringify(check.difficultyDistribution),
    JSON.stringify(check.typeDistribution),
    JSON.stringify(check.issues),
    check.summary,
    now
  );

  return {
    ...check,
    id,
    createdAt: new Date(now),
  };
}

/**
 * 获取教案的质量检查结果
 */
export function getQualityCheckByLessonId(lessonId: string): QualityCheck | null {
  const db = getDB();

  const stmt = db.prepare('SELECT * FROM quality_checks WHERE lesson_plan_id = ? ORDER BY created_at DESC LIMIT 1');
  const row = stmt.get(lessonId) as QualityCheckRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    lessonPlanId: row.lesson_plan_id,
    coverageScore: row.coverage_score,
    difficultyDistribution: JSON.parse(row.difficulty_distribution),
    typeDistribution: JSON.parse(row.type_distribution),
    issues: JSON.parse(row.issues),
    summary: row.summary,
    createdAt: new Date(row.created_at),
  };
}

// ==================== 工具函数 ====================

/**
 * 关闭数据库连接
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}
