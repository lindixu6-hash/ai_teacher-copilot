'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  type Difficulty,
  type LessonPlan,
  type QualityCheck,
  type Question,
  type QuestionType,
} from '@/types';
import { exportAndDownload } from '@/lib/export';
import { withBasePath } from '@/lib/path';

const gradeNames: Record<string, string> = {
  'primary-1': '小学一年级',
  'primary-2': '小学二年级',
  'primary-3': '小学三年级',
  'primary-4': '小学四年级',
  'primary-5': '小学五年级',
  'primary-6': '小学六年级',
  'junior-1': '初中一年级',
  'junior-2': '初中二年级',
  'junior-3': '初中三年级',
  'senior-1': '高中一年级',
  'senior-2': '高中二年级',
  'senior-3': '高中三年级',
};

const subjectNames: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  history: '历史',
  geography: '地理',
  morality: '道德与法治',
};

const textbookNames: Record<string, string> = {
  tongbian: '统编版/部编版',
  renjiao: '人教版',
  sujiao: '苏教版',
  shida: '北师大版',
  waiyan: '外研版',
  hujiao: '沪教版',
};

export default function ResultClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonPlanId = searchParams.get('id');

  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'exercise' | 'report'>('plan');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<'questions' | 'report' | null>(null);

  useEffect(() => {
    if (!lessonPlanId) {
      router.push('/');
      return;
    }

    let active = true;

    (async () => {
      setLoading(true);
      try {
        const response = await fetch(withBasePath(`/api/history?id=${lessonPlanId}`));
        const result = await response.json();
        if (active && result.success) {
          setLessonPlan(result.data.lessonPlan);
          setQuestions(result.data.questions || []);
          setQualityCheck(result.data.qualityCheck || null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [lessonPlanId, router]);

  const meta = useMemo(() => {
    if (!lessonPlan) return '';
    const parts = [
      gradeNames[lessonPlan.grade] || lessonPlan.grade,
      subjectNames[lessonPlan.subject] || lessonPlan.subject,
      lessonPlan.textbook ? textbookNames[lessonPlan.textbook] || lessonPlan.textbook : null,
      `${lessonPlan.duration} 分钟`,
    ];
    return parts.filter(Boolean).join(' · ');
  }, [lessonPlan]);

  const generateQuestions = async () => {
    if (!lessonPlanId) return;
    setWorking('questions');
    try {
      const response = await fetch(withBasePath('/api/generate/questions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonPlanId,
          types: ['choice', 'fill', 'short'] as QuestionType[],
          count: 2,
          difficulty: 'intermediate' as Difficulty,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || '生成题目失败');
      setQuestions(result.data.questions);
      setActiveTab('exercise');
    } catch (error) {
      alert(error instanceof Error ? error.message : '生成题目失败');
    } finally {
      setWorking(null);
    }
  };

  const runQualityCheck = async () => {
    if (!lessonPlanId) return;
    setWorking('report');
    try {
      const response = await fetch(withBasePath('/api/generate/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlanId }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || '质量检查失败');
      setQualityCheck(result.data);
      setActiveTab('report');
    } catch (error) {
      alert(error instanceof Error ? error.message : '质量检查失败');
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center text-sm text-[#6f685f]">正在加载教案...</div>;
  }

  if (!lessonPlan) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <div className="panel rounded-3xl border border-white/50 p-8 text-center">
          <p className="text-base font-semibold text-[#2d2a27]">教案不存在</p>
          <button onClick={() => router.push('/')} className="mt-4 rounded-full bg-[#6f8077] px-4 py-2 text-sm text-white">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="rounded-full bg-[#6f8077]/10 px-3 py-1 text-xs font-medium text-[#6f8077]">{meta}</span>
          <h1 className="mt-2 text-2xl font-semibold text-[#2d2a27] sm:text-3xl">{lessonPlan.topic}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportAndDownload({ lessonPlan, questions, qualityCheck: qualityCheck || undefined, format: 'markdown' })} className="rounded-xl border border-black/5 bg-white/60 px-3 py-1.5 text-xs text-[#6f8077]">
            导出 Markdown
          </button>
          <button onClick={() => router.push('/')} className="rounded-xl border border-black/5 bg-white/60 px-3 py-1.5 text-xs text-[#6f8077]">
            重新制作
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button onClick={generateQuestions} disabled={working === 'questions'} className="rounded-full bg-[#6f8077] px-4 py-2 text-xs font-medium text-white disabled:opacity-60">
          {working === 'questions' ? '生成题目中...' : '生成分层习题'}
        </button>
        <button onClick={runQualityCheck} disabled={working === 'report'} className="rounded-full bg-[#2d2a27] px-4 py-2 text-xs font-medium text-white disabled:opacity-60">
          {working === 'report' ? '质检中...' : '执行质量检查'}
        </button>
      </div>

      <div className="mb-8 flex max-w-sm rounded-2xl border border-black/[0.03] bg-white/40 p-1.5 shadow-sm backdrop-blur-md">
        {[
          ['plan', '结构化教案'],
          ['exercise', '分层习题'],
          ['report', '质量检查'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'plan' | 'exercise' | 'report')}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-all ${activeTab === key ? 'bg-white text-[#6f8077] shadow-sm' : 'text-[#6f685f]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'plan' && (
        <div className="panel space-y-6 rounded-3xl border border-white/50 p-6 shadow-md sm:p-8">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6f8077]">一、本课时核心教学目标</h3>
            <p className="whitespace-pre-line rounded-xl border border-black/[0.01] bg-white/40 p-4 text-sm leading-relaxed text-[#2d2a27]">
              {lessonPlan.objectives}
            </p>
          </section>
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#6f8077]">二、互动式教学过程</h3>
            <div className="ml-2 space-y-6 border-l-2 border-[#6f8077]/20 pl-4">
              {lessonPlan.content.process.map((activity, index) => (
                <div key={`${activity.stage}-${index}`} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full border-2 border-white bg-[#6f8077]" />
                  <span className="block text-xs font-bold text-[#6f8077]">
                    {activity.stage} ({activity.duration} 分钟)
                  </span>
                  <p className="mt-1 rounded-xl bg-white/30 p-3 text-xs leading-relaxed text-[#2d2a27] sm:text-sm">
                    {activity.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white/40 p-4">
              <span className="text-xs font-semibold text-[#6f685f]">板书设计</span>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-[#5f5a52]">{lessonPlan.content.boardDesign}</pre>
            </div>
            <div className="rounded-xl bg-white/40 p-4">
              <span className="text-xs font-semibold text-[#6f685f]">作业布置</span>
              <p className="mt-2 text-xs leading-relaxed text-[#5f5a52]">{lessonPlan.content.homework}</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'exercise' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="panel rounded-3xl border border-white/50 p-6 text-sm text-[#6f685f]">还没有生成题目，点击上方按钮开始生成。</div>
          ) : (
            questions.map((question, index) => <QuestionCard key={question.id} question={question} index={index} />)
          )}
        </div>
      )}

      {activeTab === 'report' && (
        <div className="panel grid grid-cols-1 gap-6 rounded-3xl border border-white/50 p-6 shadow-md md:grid-cols-2">
          {qualityCheck ? (
            <>
              <div className="space-y-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6f8077]">教学质量合规性诊断指标</h4>
                {[
                  ['目标覆盖率', qualityCheck.coverageScore, '检查目标与活动、题目之间的覆盖情况。'],
                  ['题型多样性', Object.values(qualityCheck.typeDistribution).filter((value) => value > 0).length * 30 + 10, '检查是否覆盖至少 2 类题型。'],
                  ['难度结构', 100 - Math.abs((qualityCheck.difficultyDistribution.basic || 0) - 50), '对比基础/进阶/挑战比例是否失衡。'],
                ].map(([name, score, feedback]) => (
                  <div key={String(name)} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{name}</span>
                      <span className="font-mono text-[#6f8077]">{Math.max(0, Math.min(100, Number(score)))}分</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                      <div className="h-full rounded-full bg-[#6f8077]" style={{ width: `${Math.max(0, Math.min(100, Number(score)))}%` }} />
                    </div>
                    <p className="text-[11px] text-[#6f685f]">{feedback}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-white bg-white/50 p-4">
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-[#6f8077]">进一步迭代精修方案</span>
                  <p className="text-xs leading-relaxed text-[#6f685f]">{qualityCheck.summary}</p>
                  {qualityCheck.issues.length > 0 && (
                    <ul className="mt-3 space-y-2 text-xs text-[#6f685f]">
                      {qualityCheck.issues.map((issue, index) => (
                        <li key={`${issue.message}-${index}`}>• {issue.message}{issue.suggestion ? `：${issue.suggestion}` : ''}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-4 text-right">
                  <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-700">PASSED</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-[#6f685f]">还没有执行质量检查，点击上方按钮开始分析。</div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [open, setOpen] = useState(false);
  const levelLabel = DIFFICULTY_OPTIONS.find((item) => item.value === question.difficulty)?.label || question.difficulty;
  const typeLabel = QUESTION_TYPE_OPTIONS.find((item) => item.value === question.type)?.label || question.type;
  const color = question.difficulty === 'basic' ? 'bg-green-50 text-green-700' : question.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700';

  return (
    <div className="rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs font-bold text-[#6f8077]">QUESTION 0{index + 1}</span>
          <span className={`rounded-full border border-black/5 px-2.5 py-0.5 text-[10px] ${color}`}>{levelLabel}</span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-[#6f685f]">{typeLabel}</span>
        </div>
        <button onClick={() => setOpen((value) => !value)} className="text-xs font-medium text-[#6f8077] hover:underline">
          {open ? '隐藏解析' : '查看解析'}
        </button>
      </div>
      <p className="mb-1 text-sm leading-relaxed text-[#2d2a27]">{question.content}</p>
      {question.options && question.options.length > 0 && (
        <div className="mt-3 grid gap-2 text-xs text-[#5f5a52] sm:grid-cols-2">
          {question.options.map((option, optionIndex) => (
            <div key={`${question.id}-${optionIndex}`} className="rounded-lg bg-white/50 p-2.5">
              {String.fromCharCode(65 + optionIndex)}. {option}
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className="mt-4 rounded-xl border-t border-dashed border-black/5 bg-[rgba(255,252,247,0.8)] p-4">
          <div>
            <span className="mb-0.5 block text-[11px] font-bold text-emerald-700">【标准参考答案】</span>
            <p className="text-xs font-medium text-[#2d2a27] sm:text-sm">{question.answer}</p>
          </div>
          <div className="mt-3">
            <span className="mb-0.5 block text-[11px] font-bold text-[#6f8077]">【大模型深度评析】</span>
            <p className="text-xs leading-relaxed text-[#6f685f]">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
