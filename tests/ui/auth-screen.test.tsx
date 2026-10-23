import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthScreen } from '@/ui/auth-screen'
import { LOCALE_STORAGE_KEY } from '@/ui/preference-boot'
import { PreferencesProvider } from '@/ui/preferences'

function renderSignIn(): void {
  render(
    <PreferencesProvider>
      <AuthScreen mode="sign-in" />
    </PreferencesProvider>,
  )
}

describe('auth screen', () => {
  it('keeps the English sign-in labels', () => {
    renderSignIn()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('follows a stored Spanish locale', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'es')
    renderSignIn()
    expect(await screen.findByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
  })

  it('switches language from the sign-in header', async () => {
    renderSignIn()
    const actor = userEvent.setup()
    await actor.click(screen.getByRole('button', { name: 'Spanish' }))
    expect(await screen.findByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})
