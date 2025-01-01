'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            エラーが発生しました
          </h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            {error === 'Configuration' && (
              <p>認証の設定に問題があります。システム管理者に連絡してください。</p>
            )}
            {error === 'AccessDenied' && (
              <p>アクセスが拒否されました。</p>
            )}
            {error === 'Verification' && (
              <p>認証リンクが無効または期限切れです。再度サインインしてください。</p>
            )}
            {!error && (
              <p>予期せぬエラーが発生しました。再度お試しください。</p>
            )}
          </div>
          <div className="mt-4 text-center">
            <a
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              サインインページに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 