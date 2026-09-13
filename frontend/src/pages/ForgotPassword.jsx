import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, KeyIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

function BrandMark() {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-water-tint"
      style={{ background: 'linear-gradient(140deg, #6C8CFF, #37D399)', boxShadow: '0 6px 18px -8px rgba(27,138,143,0.5)' }}
    >
      <span className="text-lg text-white leading-none font-bold" style={{ fontFamily: '"Sora", sans-serif' }}>
        PF
      </span>
    </div>
  )
}

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const requestCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      toast.success('Si el correo está registrado, recibirás un código')
      setStep(2)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al solicitar el código')
    } finally {
      setLoading(false)
    }
  }

  const reset = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, code, password)
      toast.success('Contraseña actualizada. Inicia sesión.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-3 mb-8">
          <BrandMark />
          <div className="leading-tight">
            <span className="block text-xl font-semibold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>Portal Financiero</span>
            <span className="block text-[10px] tracking-[0.2em] uppercase text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Recuperar acceso</span>
          </div>
        </div>

        <div className="card p-8 animate-slide-up shadow-flow-lg">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ArrowLeftIcon className="h-4 w-4" /> Volver al inicio de sesión
          </Link>

          {step === 1 ? (
            <>
              <p className="eyebrow mt-5">Recuperación</p>
              <h2 className="mt-2 text-3xl font-bold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>
                Olvidé mi contraseña
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Escribe tu correo y te enviaremos un código de 6 dígitos para restablecerla.
              </p>

              <form onSubmit={requestCode} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="input-label">Correo electrónico</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-faint" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin align-middle" /> : 'Enviar código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="eyebrow mt-5">Último paso</p>
              <h2 className="mt-2 text-3xl font-bold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>
                Nueva contraseña
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Ingresa el código que enviamos a <strong className="text-ink">{email}</strong> y tu nueva contraseña.
              </p>

              <form onSubmit={reset} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="reset-code" className="input-label">Código de 6 dígitos</label>
                  <div className="relative">
                    <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-faint" />
                    <input
                      id="reset-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="input-field pl-12 tracking-[0.4em] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-password" className="input-label">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="input-label">Confirmar contraseña</label>
                  <input
                    id="reset-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin align-middle" /> : 'Restablecer contraseña'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  ¿No recibiste el código? Reenviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
