// ==================== 教案相关类型 ====================

/**
 * 教案主体
 */
export interface LessonPlan {
  id: string;
  grade: string;
  subject: string;
  textbook?: string;
  topic: string;
  objectives: string;
  duration: number;
  content: LessonContent;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 教案内容结构
 */
export interface LessonContent {
  /** 教学目标 */
  objectives: {
    /** 知识与技能 */
    knowledge: string;
    /** 过程与方法 */
    process: string;
    /** 情感态度与价值观 */
    emotion: string;
  };
  /** 教学重难点 */
  keyPoints: {
    /** 教学重点 */
    key: string;
    /** 教学难点 */
    difficulty: string;
  };
  /** 教学准备 */
  preparation: {
    /** 教具 */
    teaching: string[];
    /** 学具 */
    learning: string[];
  };
  /** 教学流程 */
  process: Array<{
    /** 环节名称 */
    stage: string;
    /** 时长(分钟) */
    duration: number;
    /** 具体内容 */
    content: string;
  }>;
  /** 板书设计 */
  boardDesign: string;
  /** 作业布置 */
  homework: string;
}

/**
 * 表单输入类型
 */
export interface LessonInput {
  /** 年级 */
  grade: string;
  /** 学科 */
  subject: string;
  /** 教材版本 */
  textbook?: string;
  /** 课题 */
  topic: string;
  /** 教学目标 */
  objectives: string;
  /** 课时长度(分钟) */
  duration: number;
  /** 课程标准(可选) */
  standards?: string;
}

// ==================== 题目相关类型 ====================

/**
 * 题目类型
 */
export interface Question {
  id: string;
  /** 关联的教案ID */
  lessonPlanId: string;
  /** 题型 */
  type: QuestionType;
  /** 难度 */
  difficulty: Difficulty;
  /** 题目内容 */
  content: string;
  /** 选择题选项 */
  options?: string[];
  /** 答案 */
  answer: string;
  /** 解析 */
  explanation: string;
  /** 知识点 */
  knowledgePoint?: string;
}

/**
 * 题型枚举
 */
export type QuestionType = 'choice' | 'fill' | 'short';

/**
 * 难度枚举
 */
export type Difficulty = 'basic' | 'intermediate' | 'advanced';

/**
 * 题目生成请求
 */
export interface QuestionGenerateRequest {
  /** 教案ID */
  lessonPlanId: string;
  /** 题型列表 */
  types: QuestionType[];
  /** 每种题型的数量 */
  count: number;
  /** 难度 */
  difficulty: Difficulty;
}

/**
 * 题目生成响应
 */
export interface QuestionGenerateResponse {
  /** 生成的题目列表 */
  questions: Question[];
  /** 生成耗时(毫秒) */
  duration: number;
}

// ==================== 质量检查相关类型 ====================

/**
 * 质量检查结果
 */
export interface QualityCheck {
  id: string;
  /** 教案ID */
  lessonPlanId: string;
  /** 目标覆盖率(0-100) */
  coverageScore: number;
  /** 难度分布 */
  difficultyDistribution: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  /** 题型分布 */
  typeDistribution: {
    choice: number;
    fill: number;
    short: number;
  };
  /** 问题列表 */
  issues: QualityIssue[];
  /** 总体评价 */
  summary: string;
  /** 检查时间 */
  createdAt: Date;
}

/**
 * 质量问题
 */
export interface QualityIssue {
  /** 问题级别 */
  level: 'error' | 'warning' | 'info';
  /** 问题描述 */
  message: string;
  /** 建议改进 */
  suggestion?: string;
}

// ==================== 历史记录相关类型 ====================

/**
 * 历史记录项
 */
export interface HistoryItem {
  id: string;
  grade: string;
  subject: string;
  textbook?: string;
  topic: string;
  createdAt: Date;
  /** 关联题目数量 */
  questionCount: number;
  /** 是否已质量检查 */
  qualityChecked: boolean;
}

/**
 * 历史记录列表响应
 */
export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  hasMore: boolean;
}

// ==================== 账户与权限 ====================

export type UserRole = 'user' | 'admin';

export type SubscriptionPlan = 'free' | 'pro' | 'team';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: SubscriptionPlan;
  monthlyLimit: number;
  passwordHash?: string;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface UsageSummary {
  month: string;
  used: number;
  limit: number;
  remaining: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: SubscriptionPlan;
  monthlyLimit: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export interface AdminOverview {
  users: AdminUserSummary[];
  stats: {
    totalUsers: number;
    admins: number;
    activePlans: Record<SubscriptionPlan, number>;
    totalUsageThisMonth: number;
  };
}

export interface CurrentUserResponse {
  user: Omit<AppUser, 'passwordHash'>;
  usage: UsageSummary;
}

// ==================== API 响应类型 ====================

/**
 * 通用 API 响应
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 教案生成响应
 */
export interface LessonGenerateResponse {
  lessonPlan: LessonPlan;
  duration: number;
}

// ==================== 导出相关类型 ====================

/**
 * 导出格式
 */
export type ExportFormat = 'markdown' | 'json';

/**
 * 导出请求
 */
export interface ExportRequest {
  lessonPlanId: string;
  format: ExportFormat;
  includeQuestions?: boolean;
  includeQualityCheck?: boolean;
}

// ==================== 常量定义 ====================

/**
 * 年级选项
 */
export const GRADE_OPTIONS = [
  { value: 'primary-1', label: '小学一年级' },
  { value: 'primary-2', label: '小学二年级' },
  { value: 'primary-3', label: '小学三年级' },
  { value: 'primary-4', label: '小学四年级' },
  { value: 'primary-5', label: '小学五年级' },
  { value: 'primary-6', label: '小学六年级' },
  { value: 'junior-1', label: '初中一年级' },
  { value: 'junior-2', label: '初中二年级' },
  { value: 'junior-3', label: '初中三年级' },
  { value: 'senior-1', label: '高中一年级' },
  { value: 'senior-2', label: '高中二年级' },
  { value: 'senior-3', label: '高中三年级' },
] as const;

/**
 * 学科选项
 */
export const SUBJECT_OPTIONS = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'morality', label: '道德与法治' },
] as const;

/**
 * 题型选项
 */
export const QUESTION_TYPE_OPTIONS = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'short', label: '简答题' },
] as const;

/**
 * 难度选项
 */
export const DIFFICULTY_OPTIONS = [
  { value: 'basic', label: '基础' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '挑战' },
] as const;

/**
 * 课时选项(分钟)
 */
export const DURATION_OPTIONS = [
  { value: 30, label: '30分钟' },
  { value: 40, label: '40分钟' },
  { value: 45, label: '45分钟' },
  { value: 50, label: '50分钟' },
] as const;
