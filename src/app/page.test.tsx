import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/utils'
import Home from './page'

describe('Home', () => {
  it('renders welcome message', () => {
    render(<Home />)
    expect(screen.getByText('Welcome to TeamFlow')).toBeInTheDocument()
  })

  it('renders login and register links', () => {
    render(<Home />)
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })
}) 