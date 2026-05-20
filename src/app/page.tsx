'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DURATION_OPTIONS, GRADE_OPTIONS, SUBJECT_OPTIONS, type CurrentUserResponse, type LessonInput } from '@/types';
import { withBasePath } from '@/lib/path';
import { buildFallbackObjectives, buildFallbackStandards } from '@/lib/prompts';

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
  topic: '《草船借箭》',
  duration: 40,
  objectives: '',
  standards: '',
};

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('free@teachercopilot.local');
  const [loginPassword, setLoginPassword] = useState('Free123!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(SAMPLE_INPUT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
      if (!result.success) throw new Error(result.error?.message || '登录失败');
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      alert('请先登录');
      return;
    }

    const nextErrors: Record<string, string> = {};
    if (!formData.grade) nextErrors.grade = '请选择年级';
    if (!formData.subject) nextErrors.subject = '请选择学科';
    if (!formData.textbook) nextErrors.textbook = '请选择教材版本';
    if (!formData.topic.trim()) nextErrors.topic = '请输入课题';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const objectives = formData.objectives?.trim() || buildFallbackObjectives(formData);
      const standards = formData.standards?.trim() || buildFallbackStandards(formData);
      const response = await fetch(withBasePath('/api/generate/lesson'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, objectives, standards }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || '生成失败');
      router.push(`/result?id=${result.data.lessonPlan.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl animate-fade-in py-8">
      <div className="mb-6 flex items-center justify-between rounded-3xl border border-white/50 bg-white/50 p-4 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#6f8077]">AI Teacher Copilot</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#2d2a27]">教师端 AI 备课与出题助手</h1>
        </div>
        {currentUser ? (
          <button onClick={handleLogout} className="rounded-full bg-[#2d2a27] px-4 py-2 text-sm text-white">
            退出
          </button>
        ) : (
          <button onClick={() => document.getElementById('login-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="rounded-full bg-[#6f8077] px-4 py-2 text-sm text-white">
            登录
          </button>
        )}
      </div>

      {authLoading ? (
        <div className="panel mb-8 rounded-3xl border border-white/50 p-6 text-sm text-[#6f685f]">正在校验登录状态...</div>
      ) : !currentUser ? (
        <div id="login-box" className="panel mb-8 rounded-3xl border border-white/50 p-6 shadow-md sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6f8077]">登录</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2d2a27]">先登录，再进入产品页</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6f685f]">支持演示账号、套餐、用量限制与管理后台。</p>
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#6f8077]">账户</p>
              <h2 className="mt-1 text-xl font-semibold text-[#2d2a27]">{currentUser.user.name}</h2>
              <p className="mt-1 text-sm text-[#6f685f]">{currentUser.user.email} · {currentUser.user.plan}</p>
            </div>
            <button onClick={() => router.push('/result?id=demo')} className="rounded-full bg-white/70 px-4 py-2 text-sm text-[#6f685f]">
              查看结果页
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`panel space-y-6 rounded-3xl border border-white/50 p-6 shadow-md sm:p-8 ${!currentUser ? 'opacity-80' : ''}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <SelectField label="年级" error={errors.grade} value={formData.grade} onChange={(value) => setFormData({ ...formData, grade: value })} options={GRADE_OPTIONS} placeholder="请选择年级" />
          <SelectField label="学科" error={errors.subject} value={formData.subject} onChange={(value) => setFormData({ ...formData, subject: value })} options={SUBJECT_OPTIONS} placeholder="请选择学科" />
          <SelectField label="教材版本" error={errors.textbook} value={formData.textbook} onChange={(value) => setFormData({ ...formData, textbook: value })} options={TEXTBOOK_OPTIONS} placeholder="请选择教材" />
          <SelectField label="课时设计" value={String(formData.duration)} onChange={(value) => setFormData({ ...formData, duration: parseInt(value, 10) })} options={DURATION_OPTIONS.map((item) => ({ value: String(item.value), label: item.label }))} placeholder="请选择课时" />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">课题名称</label>
          <div className={`input-shell rounded-xl border bg-white/60 p-2.5 ${errors.topic ? 'border-red-400' : 'border-black/5'}`}>
            <input value={formData.topic} onChange={(event) => setFormData({ ...formData, topic: event.target.value })} placeholder="请输入具体章节或课文核心名称" className="w-full bg-transparent text-sm text-[#2d2a27] outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">教学目标</label>
          <div className="input-shell rounded-xl border border-black/5 bg-white/60 p-3">
            <textarea rows={4} value={formData.objectives || ''} onChange={(event) => setFormData({ ...formData, objectives: event.target.value })} placeholder="可留空，系统会自动生成。" className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#2d2a27] outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-[#6f685f]">课程标准 / 备课约束（可选）</label>
          <div className="input-shell rounded-xl border border-black/5 bg-white/60 p-3">
            <textarea rows={3} value={formData.standards || ''} onChange={(event) => setFormData({ ...formData, standards: event.target.value })} placeholder="可留空，系统会自动补齐。" className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#2d2a27] outline-none" />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#6f8077] py-3.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-95 disabled:opacity-60">
          <span>{submitting ? '生成中...' : '一键生成教案'}</span>
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
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full cursor-pointer bg-transparent text-sm text-[#2d2a27] outline-none">
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
