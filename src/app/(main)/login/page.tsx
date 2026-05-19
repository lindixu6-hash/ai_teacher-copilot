'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-[#6f685f]">正在跳转到首页登录区...</div>;
}
