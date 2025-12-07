'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 首页 - 自动跳转到登录页面
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>正在跳转到登录页面...</p>
      </div>
    </div>
  );
}
