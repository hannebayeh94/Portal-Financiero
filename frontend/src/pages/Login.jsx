import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, LockClosedIcon, ChartBarIcon } from '@heroicons/react/24/outline'

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? 'w-9 h-9' : 'w-12 h-12'} rounded-full flex items-center justify-center flex-shrink-0 border border-water-tint`}
      style={{ background: 'linear-gradient(140deg, #6C8CFF, #37D399)', boxShadow: '0 6px 18px -8px rgba(27,138,143,0.5)' }}
    >
      <span className={`${small ? 'text-sm' : 'text-lg'} text-white leading-none font-bold`} style={{ fontFamily: '"Sora", sans-serif' }}>
        PF
      </span>
    </div>
  )
}

/* Corrientes decorativas del panel de marca */
function FlowRivers() {
  return (
    <svg viewBox="0 0 480 300" fill="none" className="w-full max-w-md" aria-hidden="true">
      <path d="M10 150 C 120 150, 160 60, 250 60 C 330 60, 360 30, 470 30"
        stroke="#6C8CFF" strokeWidth="14" strokeLinecap="round" opacity="0.9"
        pathLength="1" className="animate-flow-draw" />
      <path d="M10 150 C 120 150, 160 150, 250 150 C 340 150, 380 120, 470 120"
        stroke="#FF6B6B" strokeWidth="9" strokeLinecap="round" opacity="0.85"
        pathLength="1" className="animate-flow-draw" style={{ animationDelay: '180ms' }} />
      <path d="M10 150 C 120 150, 170 240, 260 240 C 350 240, 390 272, 470 272"
        stroke="#F5B84B" strokeWidth="7" strokeLinecap="round" opacity="0.85"
        pathLength="1" className="animate-flow-draw" style={{ animationDelay: '320ms' }} />
      <circle cx="452" cy="30" r="8" fill="#6C8CFF" />
      <circle cx="452" cy="120" r="7" fill="#FF6B6B" />
      <circle cx="452" cy="272" r="6" fill="#F5B84B" />
      <circle cx="24" cy="150" r="16" fill="#10151F" stroke="#E8EEF7" strokeWidth="3" />
      <circle cx="24" cy="150" r="6" fill="#E8EEF7" />
    </svg>
  )
}

const flowStats = [
  { value: '1·4', label: 'Cuatro por mil automatizado' },
  { value: '100%', label: 'Control de cada peso' },
  { value: 'S/2', label: 'Tus proyecciones, en segundos' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('¡Bienvenido de vuelta!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24 relative overflow-hidden border-r border-mist">
        <div className="relative z-10 max-w-lg">
          <BrandMark />
          <p className="eyebrow mt-8">El mapa de tu dinero</p>
          <h1 className="mt-4 text-6xl font-bold text-ink leading-[1.04]" style={{ fontFamily: '"Sora", sans-serif' }}>
            Mira hacia dónde
            <span className="text-water"> fluye</span> tu plata
          </h1>
          <p className="mt-6 text-lg text-ink-muted leading-relaxed max-w-md">
            Ingresos, egresos, deudas y ahorros como corrientes en un solo mapa. Sin letra pequeña, sin comisiones ocultas.
          </p>

          <div className="mt-10 mb-8"><FlowRivers /></div>

          <div className="space-y-0">
            {flowStats.map((s) => (
              <div key={s.label} className="flex items-center gap-4 py-3 border-b border-mist">
                <span className="fig text-2xl text-water-dark w-16">{s.value}</span>
                <span className="text-sm text-ink-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-8 left-16 xl:left-24 z-10 text-[11px] tracking-[0.2em] uppercase text-ink-faint" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Portal Financiero · Flujo v1
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark small />
            <div className="leading-tight">
              <span className="block text-xl font-semibold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>Portal Financiero</span>
              <span className="block text-[10px] tracking-[0.2em] uppercase text-ink-muted" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Tu mapa financiero</span>
            </div>
          </div>

          <div className="card p-8 animate-slide-up shadow-flow-lg">
            <p className="eyebrow">Acceso</p>
            <h2 className="mt-2 text-3xl font-bold text-ink" style={{ fontFamily: '"Sora", sans-serif' }}>
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="login-email" className="input-label">Correo electrónico</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="input-label">Contraseña</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
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

              <div className="flex justify-end -mt-1">
                <Link to="/forgot-password" className="text-sm font-medium text-water-dark hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin align-middle" />
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-muted">
              <span>¿No tienes cuenta?</span>
              <Link to="/register" className="font-semibold underline underline-offset-4 decoration-water/50 hover:text-water-dark transition-colors">
                Regístrate aquí
              </Link>
            </div>

            <div className="mt-7 pt-5 border-t border-line flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink-faint" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <span className="flex items-center gap-1.5"><ShieldCheckIcon className="h-3.5 w-3.5" /> Cifrado AES</span>
              <span className="flex items-center gap-1.5"><LockClosedIcon className="h-3.5 w-3.5" /> Sesión segura</span>
              <span className="flex items-center gap-1.5"><ChartBarIcon className="h-3.5 w-3.5" /> 1 cuenta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
