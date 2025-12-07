'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 直接跳转到登录页面
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

/*
// 以下内容已移除，直接跳转到登录页面
export default function HomeOld() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">📬 简化邮件转发系统</h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            安全、简洁、高效
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            为 Netflix 邮件验证码转发提供的本地化解决方案。
            7天自动清理，密码保护，无需登录账户。
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
          >
            进入系统 →
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-3">密码保护</h3>
            <p className="text-slate-300">
              所有页面都需要密码验证，保护你的邮件隐私。
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-white mb-3">自动清理</h3>
            <p className="text-slate-300">
              转发的邮件仅保存 7 天，7天后自动删除，完全隐私。
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-3">智能过滤</h3>
            <p className="text-slate-300">
              按来源、标题、包含字、排除字进行精细化过滤。
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">💾</div>
            <h3 className="text-xl font-bold text-white mb-3">本地数据库</h3>
            <p className="text-slate-300">
              所有数据存储在本地 SQLite 数据库，完全掌控。
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">☁️</div>
            <h3 className="text-xl font-bold text-white mb-3">Cloudflare 集成</h3>
            <p className="text-slate-300">
              使用 Cloudflare Email Routing 接收邮件，安全可靠。
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">快速部署</h3>
            <p className="text-slate-300">
              基于 Next.js，部署在本地服务器，无需复杂配置。
            </p>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-20 bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6">快速开始</h3>
          
          <div className="space-y-6 text-slate-300">
            <div>
              <p className="font-semibold text-white mb-2">1. 环境配置</p>
              <code className="bg-slate-900 p-3 rounded block text-sm">
                cp .env.example .env.local
              </code>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">2. 配置密码</p>
              <p>在 <code className="bg-slate-900 px-2 py-1 rounded text-sm">.env.local</code> 中设置：</p>
              <code className="bg-slate-900 p-3 rounded block text-sm mt-2">
                ADMIN_PASSWORD=你的密码
              </code>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">3. 配置转发规则</p>
              <p>在数据库中添加转发规则，例如：</p>
              <code className="bg-slate-900 p-3 rounded block text-sm mt-2">
                {`from_addr: *@netflix.com
subject_contains: Your temporary access code
forward_to: your-email@example.com`}
              </code>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">4. 启动开发服务器</p>
              <code className="bg-slate-900 p-3 rounded block text-sm">
                npm run dev
              </code>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">5. 配置 Cloudflare Email Routing</p>
              <p>将邮件路由的 Webhook 指向：</p>
              <code className="bg-slate-900 p-3 rounded block text-sm mt-2">
                https://your-domain.com/api/webhook/email
              </code>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-20 bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6">API 端点</h3>
          
          <div className="space-y-6 text-slate-300">
            <div>
              <p className="font-semibold text-white mb-2">POST /api/webhook/email</p>
              <p className="mb-2">接收来自 Cloudflare 或其他邮件服务的邮件</p>
              <code className="bg-slate-900 p-3 rounded block text-sm whitespace-pre-wrap">
{`请求体 (JSON):
{
  "from": "info@netflix.com",
  "to": "your-email@example.com",
  "subject": "Your temporary access code",
  "body": "Your code is: 123456"
}`}
              </code>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">POST /api/auth/login</p>
              <p className="mb-2">使用密码登录获取令牌</p>
            </div>

            <div>
              <p className="font-semibold text-white mb-2">GET /api/emails</p>
              <p className="mb-2">获取转发的邮件列表（需要身份验证）</p>
              <p className="text-sm">参数: limit (默认 20), offset (默认 0)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>简化邮件转发系统 © 2025</p>
        </div>
      </footer>
    </div>
  );
}
