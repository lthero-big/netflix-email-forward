'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ForwardedEmail {
  id: number;
  message_id: string | null;
  rule_id: number;
  from_addr: string;
  to_addr: string;
  subject: string | null;
  body: string | null;
  html_body: string | null;
  raw_email: string | null;
  forwarded_to: string;
  created_at: string;
  expires_at: string;
}

interface Stats {
  totalEmails: number;
  activeEmails: number;
  totalRules: number;
  enabledRules: number;
}

interface ApiResponse {
  success: boolean;
  data: ForwardedEmail[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  stats: Stats;
  error?: string;
}

export default function DashboardPage() {
  const [emails, setEmails] = useState<ForwardedEmail[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<ForwardedEmail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchEmails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/emails?limit=20&offset=0', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setEmails(data.data);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEmails();

    // 每 30 秒刷新一次数据
    const interval = setInterval(fetchEmails, 30000);

    return () => clearInterval(interval);
  }, [fetchEmails]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  const handleViewEmail = (email: ForwardedEmail) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmail(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">邮件转发系统</h1>
            <p className="text-sm text-slate-600 mt-1">安全转发 Netflix 验证邮件</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
          >
            登 出
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <p className="text-sm font-medium text-slate-600">活跃邮件</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeEmails}</p>
              <p className="text-xs text-slate-500 mt-1">未过期的邮件</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <p className="text-sm font-medium text-slate-600">总邮件数</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalEmails}</p>
              <p className="text-xs text-slate-500 mt-1">所有已保存的邮件</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <p className="text-sm font-medium text-slate-600">启用规则</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.enabledRules}</p>
              <p className="text-xs text-slate-500 mt-1">活跃的转发规则</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <p className="text-sm font-medium text-slate-600">总规则数</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalRules}</p>
              <p className="text-xs text-slate-500 mt-1">配置的转发规则</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Emails Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">收到的邮件</h2>
            <p className="text-sm text-slate-600 mt-1">最近 20 条邮件（7天后自动删除）</p>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">加载中...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">暂无邮件</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      发件人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      主题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      转发至
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      接收时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      过期时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {email.from_addr}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 truncate max-w-xs">
                        {email.subject || '（无主题）'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {email.forwarded_to}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDistanceToNow(new Date(email.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDistanceToNow(new Date(email.expires_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewEmail(email)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Email Details Modal */}
      {isModalOpen && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">邮件详情</h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-blue-100 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  发件人
                </p>
                <p className="text-slate-900 font-medium mt-1">{selectedEmail.from_addr}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  收件人
                </p>
                <p className="text-slate-900 font-medium mt-1">{selectedEmail.to_addr}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  转发至
                </p>
                <p className="text-slate-900 font-medium mt-1">{selectedEmail.forwarded_to}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  主题
                </p>
                <p className="text-slate-900 font-medium mt-1">
                  {selectedEmail.subject || '（无主题）'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  接收时间
                </p>
                <p className="text-slate-900 mt-1">
                  {new Date(selectedEmail.created_at).toLocaleString('zh-CN')}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  过期时间
                </p>
                <p className="text-slate-900 mt-1">
                  {new Date(selectedEmail.expires_at).toLocaleString('zh-CN')}
                </p>
              </div>

              {selectedEmail.body && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    邮件内容
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg mt-2 border border-slate-200 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {selectedEmail.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg transition duration-200 font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
