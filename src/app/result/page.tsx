import { Suspense } from 'react';
import ResultClientPage from './result-client';

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center text-sm text-[#6f685f]">加载中...</div>}>
      <ResultClientPage />
    </Suspense>
  );
}
