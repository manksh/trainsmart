import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TopNav } from './TopNav'

// Mock the hooks and modules
const mockPush = vi.fn()
const mockLogout = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/athlete',
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    logout: mockLogout,
    isLoading: false,
  }),
}))

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn().mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    memberships: [
      {
        organization_id: 'org-1',
        organization_name: 'Test Team',
        role: 'athlete',
      },
    ],
  }),
}))

describe('TopNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation items', async () => {
    render(<TopNav />)

    // Wait for async state updates
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Train')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('renders the brand/logo button', async () => {
    render(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('CTLST Labs')).toBeInTheDocument()
    })
  })

  it('navigates to home when clicking the logo', async () => {
    render(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('CTLST Labs')).toBeInTheDocument()
    })

    const logoButton = screen.getByText('CTLST Labs').closest('button')
    fireEvent.click(logoButton!)

    expect(mockPush).toHaveBeenCalledWith('/athlete')
  })

  it('navigates to train page when clicking Train nav item', async () => {
    render(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('Train')).toBeInTheDocument()
    })

    // Click the nav item with "Train" text specifically
    const trainNavItem = screen.getByText('Train').closest('button')
    fireEvent.click(trainNavItem!)

    expect(mockPush).toHaveBeenCalledWith('/train')
  })

  it('navigates to profile page when clicking Profile', async () => {
    render(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    const profileNavItem = screen.getByText('Profile').closest('button')
    fireEvent.click(profileNavItem!)

    expect(mockPush).toHaveBeenCalledWith('/profile')
  })

  it('calls logout when clicking sign out button', async () => {
    render(<TopNav />)

    await waitFor(() => {
      expect(screen.getByTitle('Sign out')).toBeInTheDocument()
    })

    const signOutButton = screen.getByTitle('Sign out')
    fireEvent.click(signOutButton)

    expect(mockLogout).toHaveBeenCalled()
  })

  it('highlights the active navigation item', async () => {
    render(<TopNav />)

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    // Home should be active since pathname is '/athlete'
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).toHaveClass('bg-sage-50', 'text-sage-700')
  })
})
