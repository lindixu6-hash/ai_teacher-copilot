'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HistoryItem } from '@/types';
import { withBasePath } from '@/lib/path';

const gradeNames: Record<string, string> = {
  'primary-1': '小一',
  'primary-2': '小二',
  'primary-3': '小三',
  'primary-4': '小四',
  'primary-5': '小五',
  'primary-6': '小六',
  'junior-1': '初一',
  'junior-2': '初二',
  'junior-3': '初三',
  'senior-1': '高一',
  'senior-2': '高二',
  'senior-3': '高三',
};

const subjectNames: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  biology: '生物',
  physics: '物理',
  chemistry: '化学',
  history: '历史',
  geography: '地理',
  morality: '道德与法治',
};

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [now] = useState(() => Date.now());
  const pageSize = 20;

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const response = await fetch(withBasePath(`/api/history?limit=${pageSize}&offset=${page * pageSize}`));
        const result = await response.json();
        if (active && result.success) {
          setHistory(result.data.items);
          setTotal(result.data.total);
        }
      } catch (error) {
        console.error('加载历史记录失败:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [page, refreshIndex]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个教案吗？')) return;
    try {
      const response = await fetch(withBasePath(`/api/history?id=${id}`), { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setRefreshIndex((i) => i + 1);
      } else {
        alert(result.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const formatDate = (date: Date) => {
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#2d2a27]">历史记录</h1>
        <p className="mt-1 text-[#6f685f]">共 {total} 个教案</p>
      </div>

      <button onClick={() => router.push('/')} className="mb-6 inline-flex items-center text-sm text-[#6f8077] hover:underline">
        ← 返回首页
      </button>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel animate-pulse rounded-[28px] p-6">
              <div className="mb-3 h-5 w-3/4 rounded bg-[#e9e0d5]" />
              <div className="h-4 w-1/2 rounded bg-[#efe7dd]" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="panel rounded-[28px] p-10 text-center">
          <p className="text-base font-semibold text-[#2d2a27]">还没有创建过教案</p>
          <p className="mt-2 text-sm text-[#6f685f]">先生成一份教案，历史页会自动记录你的工作流。</p>
          <button onClick={() => router.push('/')} className="mt-5 rounded-full bg-[#6f8077] px-5 py-2.5 text-sm font-semibold text-white">
            创建第一个教案
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <article key={item.id} className="panel rounded-[28px] p-6 transition-transform hover:-translate-y-0.5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <button onClick={() => router.push(`/result?id=${item.id}`)} className="text-left">
                  <h3 className="text-lg font-semibold text-[#2d2a27] hover:text-[#6f8077]">{item.topic}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#6a6259]">
                    <span className="rounded-full bg-[#f3eee6] px-3 py-1">{gradeNames[item.grade] || item.grade}</span>
                    <span className="rounded-full bg-[#f3eee6] px-3 py-1">{subjectNames[item.subject] || item.subject}</span>
                    <span className="rounded-full bg-[#f3eee6] px-3 py-1">{formatDate(new Date(item.createdAt))}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  {item.questionCount > 0 && (
                    <span className="rounded-full bg-[#edf2ed] px-3 py-1 text-xs font-semibold text-[#5b6b62]">{item.questionCount} 题</span>
                  )}
                  {item.qualityChecked && (
                    <span className="rounded-full bg-[#f1ebe1] px-3 py-1 text-xs font-semibold text-[#7a664f]">已质检</span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[rgba(88,76,64,0.08)] pt-4">
                <button onClick={() => router.push(`/result?id=${item.id}`)} className="text-sm font-semibold text-[#5b6d64] hover:text-[#3f5149]">
                  查看详情
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-sm font-semibold text-[#a35f54] hover:text-[#813c32]">
                  删除
                </button>
              </div>
            </article>
          ))}

          {total > pageSize && (
            <div className="panel flex items-center justify-between rounded-[28px] px-4 py-4">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#5f5a52] disabled:opacity-50">
                上一页
              </button>
              <span className="text-sm text-[#665e55]">
                第 {page + 1} 页，共 {Math.ceil(total / pageSize)} 页
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * pageSize >= total} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#5f5a52] disabled:opacity-50">
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
