'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/path';
import type { AdminOverview } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch(withBasePath('/api/admin/overview'));
        const result = await response.json();
        if (active && result.success) setOverview(result.data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-[#6f685f]">正在加载管理后台...</div>;
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="panel rounded-3xl p-8">
          <p className="text-sm text-[#6f685f]">你还没有管理员权限，或尚未登录。</p>
          <button onClick={() => router.push('/')} className="mt-4 rounded-full bg-[#6f8077] px-4 py-2 text-sm text-white">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#6f8077]">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#2d2a27]">管理后台</h1>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="用户总数" value={overview.stats.totalUsers} />
        <StatCard label="管理员" value={overview.stats.admins} />
        <StatCard label="本月总用量" value={overview.stats.totalUsageThisMonth} />
        <StatCard label="Pro / Team" value={`${overview.stats.activePlans.pro + overview.stats.activePlans.team}`} />
      </div>
      <div className="space-y-3">
        {overview.users.map((user) => (
          <div key={user.id} className="panel flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-[#2d2a27]">{user.name}</div>
              <div className="text-sm text-[#6f685f]">{user.email} · {user.role} · {user.plan}</div>
            </div>
            <div className="text-sm text-[#5f5a52]">
              {user.usedThisMonth} / {user.monthlyLimit} · 剩余 {user.remainingThisMonth}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="panel rounded-3xl p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-[#6f8077]">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#2d2a27]">{value}</div>
    </div>
  );
}
