'use client'

import { signIn } from 'next-auth/react'
import { FaGithub, FaGoogle } from 'react-icons/fa'

interface SignInFormProps {
  providers: Record<string, any> | null
}

export default function SignInForm({ providers }: SignInFormProps) {
  if (!providers) return null

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-4">
        {Object.values(providers).map((provider: any) => (
          <button
            key={provider.id}
            onClick={() => signIn(provider.id)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {provider.id === 'github' && <FaGithub className="mr-2" />}
            {provider.id === 'google' && <FaGoogle className="mr-2" />}
            {provider.name}でサインイン
          </button>
        ))}
      </div>
    </div>
  )
} 