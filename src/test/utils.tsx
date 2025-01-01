import { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

const mockSession = {
  expires: new Date(Date.now() + 2 * 86400).toISOString(),
  user: { name: "Test User", email: "test@example.com" }
}

const customRender = (ui: ReactElement, options = {}) =>
  render(ui, {
    wrapper: ({ children }) => (
      <SessionProvider session={mockSession}>{children}</SessionProvider>
    ),
    ...options,
  })

export * from '@testing-library/react'
export { customRender as render } 