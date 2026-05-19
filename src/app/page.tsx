'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DURATION_OPTIONS, GRADE_OPTIONS, SUBJECT_OPTIONS, type CurrentUserResponse, type LessonInput } from '@/types';
import { withBasePath } from '@/lib/path';

const TEXTBOOK_OPTIONS = [
  { value: 'tongbian', label: '统编版/部编版' },
  { value: 'renjiao', label: '人教版' },
  { value: 'sujiao', label: '苏教版' },
  { value: 'shida', label: '北师大版' },
  { value: 'waiyan', label: '外研版' },
  { value: 'hujiao', label: '沪教版' },
];

type FormState = LessonInput & { textbook: string };

const SAMPLE_INPUT: FormState = {
  grade: 'primary-5',
  subject: 'chinese',
  textbook: 'tongbian',
  topic: '《少年中国说（节选）》',
  duration: 40,
  objectives:
    '1. 正确、流利、有感情地朗读课文，背诵课文。\n2. 理解课文内容，体会作者强烈的爱国主义情感。\n3. 结合历史与现实，理解“少年强则国强”的深刻内涵。',
  standards: '对齐学段核心素养，突出情感态度与价值观的培养。',
};

const SUGGESTED_TOPICS = [
  { label: '桃花源记', grade: 'junior-2', subject: 'chinese', textbook: 'tongbian' },
  { label: '勾股定理', grade: 'junior-2', subject: 'math', textbook: 'renjiao' },
  { label: '光合作用', grade: 'senior-1', subject: 'biology', textbook: 'renjiao' },
];

const LOADING_STEPS = [
  '分析教学目标与核心素养要求',
  '构建结构化教案与课堂环节',
  '生成分层练习题与答案解析',
  '执行质量检查并准备导出内容',
];

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('free@teachercopilot.local');
  const [loginPassword, setLoginPassword] = useState('Free123!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    grade: '',
    subject: '',
    textbook: '',
    topic: '',
    duration: 40,
    objectives: '',
    standards: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await fetch(withBasePath('/api/auth/me'));
        const result = await response.json();
        if (active && result.success) {
          setCurrentUser(result.data);
        } else if (active) {
          setCurrentUser(null);
        }
      } catch {
        if (active) setCurrentUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);
    try {
      const response = await fetch(withBasePath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || '登录失败');
      }
      setCurrentUser(result.data);
    } catch (error) {
      alert(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch(withBasePath('/api/auth/logout'), { method: 'POST' });
    setCurrentUser(null);
  };

  const fillSample = () => {
    setFormData(SAMPLE_INPUT);
    setErrors({});
  };

  const selectTag = (tag: (typeof SUGGESTED_TOPICS)[number]) => {
    setFormData({
      grade: tag.grade,
      subject: tag.subject,
      textbook: tag.textbook,
      topic: tag.label,
      duration: 40,
      objectives:
        '1. 掌握本节课相关核心基础知识。\n2. 深入理解课文/章节重点逻辑。\n3. 达成学科素养要求的实际应用能力。',
      standards: '',
    });
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      alert('请先登录后再生成教案');
      return;
    }
    const nextErrors: Record<string, string> = {};

    if (!formData.grade) nextErrors.grade = '请选择年级';
    if (!formData.subject) nextErrors.subject = '请选择学科';
    if (!formData.textbook) nextErrors.textbook = '请选择教材版本';
    if (!formData.topic.trim()) nextErrors.topic = '请输入课题';
    if (!formData.objectives.trim()) nextErrors.objectives = '请输入教学目标';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setLoadingIndex(0);

    const timers = [
      setTimeout(() => setLoadingIndex(1), 1200),
      setTimeout(() => setLoadingIndex(2), 2800),
      setTimeout(() => setLoadingIndex(3), 4300),
    ];

    try {
      const response = await fetch(withBasePath('/api/generate/lesson'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '生成失败，请稍后重试');
      }

      router.push(`/result?id=${result.data.lessonPlan.id}`);
    } catch (error) {
      setSubmitting(false);
      alert(error instanceof Error ? error.message : '生成失败，请稍后重试');
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  if (submitting) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center animate-fade-in">
        <div className="panel w-full rounded-3xl border border-white/50 p-8 text-center shadow-lg">
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-[#6f8077]/20 border-t-[#6f8077]" />
          <h3 className="mb-2 text-xl font-medium text-[#2d2a27]">AI 老师正在为您精心备课...</h3>
          <p className="mb-8 text-xs text-[#6f685f]">优质的结构化教学资产需要数秒的模型推演，请稍候。</p>
          <div className="mx-auto max-w-md space-y-4 text-left">
            {LOADING_STEPS.map((step, index) => {
              const done = loadingIndex > index;
              const current = loadingIndex === index;
              return (
                <div
                  key={step}
                  className={`flex items-center space-x-3 transition-all ${current ? 'translate-x-1 opacity-100' : done ? 'opacity-60' : 'opacity-20'}`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${done ? 'bg-[#6f8077] text-white' : 'border border-[#6f685f] text-[#6f685f]'}`}>
                    {done ? '✓' : index + 1}
                  </div>
                  <span className="text-xs text-[#2d2a27] sm:text-sm">{step}</span>
                  {current && <span className="animate-pulse rounded bg-[#6f8077]/10 px-1.5 py-0.5 text-[10px] text-[#6f8077]">进行中</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in py-8">
      <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-white/50 bg-white/50 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#6f8077]">AI Teacher Copilot</p>
          <h2 className="mt-1 text-lg font-semibold text-[#2d2a27]">教案、题目、质检、后台一体化工作台</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button onClick={() => router.push('/history')} className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-[#6f685f]">
            历史记录
          </button>
          <button onClick={() => router.push('/admin')} className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-[#6f685f]">
            管理后台
          </button>
          {currentUser ? (
            <button onClick={handleLogout} className="rounded-full bg-[#2d2a27] px-4 py-2 text-white">
              退出登录
            </button>
          ) : (
            <button onClick={() => document.getElementById('login-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="rounded-full bg-[#6f8077] px-4 py-2 text-white">
              立即登录
            </button>
          )}
        </div>
      </div>

      {authLoading ? (
        <div className="panel mb-8 rounded-3xl border border-white/50 p-6 text-sm text-[#6f685f]">正在校验登录状态...</div>
      ) : !currentUser ? (
        <div id="login-box" className="panel mb-8 rounded-3xl border border-white/50 p-6 shadow-md sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6f8077]">登录</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#2d2a27]">用账号进入更像商用产品的版本</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6f685f]">支持套餐、月度用量、后台管理和生成权限控制。先用内置示例账号登录即可体验完整流程。</p>
              <div className="mt-4 rounded-2xl bg-white/60 p-4 text-sm text-[#5f5a52]">
                <p>示例账号：</p>
                <p className="mt-2">free@teachercopilot.local / Free123!</p>
                <p>pro@teachercopilot.local / Pro123!</p>
                <p>admin@teachercopilot.local / Admin123!</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3 rounded-2xl border border-black/5 bg-white/70 p-4">
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="邮箱" />
              <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" placeholder="密码" />
              <button disabled={loginLoading} className="w-full rounded-xl bg-[#6f8077] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {loginLoading ? '登录中...' : '登录'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="panel mb-8 rounded-3xl border border-white/50 p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#6f8077]">账户状态</p>
              <h3 className="mt-1 text-xl font-semibold text-[#2d2a27]">{currentUser.user.name}，欢迎回来</h3>
              <p className="mt-1 text-sm text-[#6f685f]">{currentUser.user.email} · {currentUser.user.plan} · 本月剩余 {currentUser.usage.remaining} 次</p>
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-[#5f5a52]">
              <div>月额度 {currentUser.usage.used} / {currentUser.usage.limit}</div>
              <div className="mt-1">建议优先使用 Pro/Team 套餐演示</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2d2a27]">AI Teacher Copilot</h1>
          <p className="mt-1 text-sm text-[#6f685f]">输入基础教学信息，一键生成可落地的教案、题目与质量报告</p>
        </div>
        <button
          type="button"
          onClick={fillSample}
          className="self-start rounded-full border border-[#6f8077]/30 bg-white/40 px-4 py-2 text-xs font-medium text-[#6f8077] transition-all hover:bg-[#6f8077]/5 sm:self-center"
        >
          填入官方精选示例
        </button>
      </div>

      <form onSubmit={handleSubmit} className={`panel space-y-6 rounded-3xl border border-white/50 p-6 shadow-md sm:p-8 ${!currentUser ? 'opacity-80' : ''}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <SelectField
            label="年级"
            error={errors.grade}
            value={formData.grade}
            onChange={(value) => setFormData({ ...formData, grade: value })}
            options={GRADE_OPTIONS}
            placeholder="请选择年级"
          />
          <SelectField
            label="学科"
            error={errors.subject}
            value={formData.subject}
            onChange={(value) => setFormData({ ...formData, subject: value })}
            options={SUBJECT_OPTIONS}
            placeholder="请选择学科"
          />
          <SelectField
            label="教材版本"
            error={errors.textbook}
            value={formData.textbook}
            onChange={(value) => setFormData({ ...formData, textbook: value })}
            options={TEXTBOOK_OPTIONS}
            placeholder="请选择教材"
          />
          <SelectField
            label="课时设计"
            value={String(formData.duration)}
            onChange={(value) => setFormData({ ...formData, duration: parseInt(value, 10) })}
            options={DURATION_OPTIONS.map((item) => ({ value: String(item.value), label: item.label }))}
            placeholder="请选择课时"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">课题名称</label>
          <div className={`input-shell rounded-xl border bg-white/60 p-2.5 ${errors.topic ? 'border-red-400' : 'border-black/5'}`}>
            <input
              value={formData.topic}
              onChange={(event) => setFormData({ ...formData, topic: event.target.value })}
              placeholder="请输入具体章节或课文核心名称"
              className="w-full bg-transparent text-sm text-[#2d2a27] outline-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-[#6f685f]">快捷灵感模板:</span>
            {SUGGESTED_TOPICS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => selectTag(tag)}
                className="rounded-full border border-black/[0.03] bg-white/80 px-3 py-1 text-xs text-[#6f685f] transition-all hover:bg-[#6f8077]/10 hover:text-[#6f8077]"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">教学目标与核心素养要求</label>
          <div className={`input-shell rounded-xl border bg-white/60 p-3 ${errors.objectives ? 'border-red-400' : 'border-black/5'}`}>
            <textarea
              rows={5}
              value={formData.objectives}
              onChange={(event) => setFormData({ ...formData, objectives: event.target.value })}
              placeholder="请输入核心教学意图及目标要求..."
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#2d2a27] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">课程标准 / 备课约束（可选）</label>
          <div className="input-shell rounded-xl border border-black/5 bg-white/60 p-3">
            <textarea
              rows={3}
              value={formData.standards || ''}
              onChange={(event) => setFormData({ ...formData, standards: event.target.value })}
              placeholder="例如：突出任务驱动、小组互动、分层目标等"
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#2d2a27] outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#6f8077] py-3.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-95"
        >
          <span>一键生成全套备课资产</span>
        </button>
      </form>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string | number; label: string }>;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">{label}</label>
      <div className={`input-shell flex items-center justify-between rounded-xl border bg-white/60 p-2.5 ${error ? 'border-red-400' : 'border-black/5'}`}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-[#2d2a27] outline-none"
        >
          <option value="" disabled hidden>{placeholder}</option>
          {options.map((item) => (
            <option key={String(item.value)} value={String(item.value)}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="text-[#6f685f]">⌄</span>
      </div>
    </div>
  );
}
