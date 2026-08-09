import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, LockClosedIcon, ChartBarIcon } from '@heroicons/react/24/outline'

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? 'w-10 h-10' : 'w-14 h-14'} rounded-full flex items-center justify-center flex-shrink-0 border shadow-[0_0_0_5px_rgba(226,177,83,0.12),0_0_0_7px_rgba(226,177,83,0.06)]`}
      style={{ background: 'radial-gradient(circle at 35% 30%, #f0cb7e, #d9a440 70%)', borderColor: '#b3872f' }}
    >
      <span className={`${small ? 'text-base' : 'text-xl'} text-[#1a1407] leading-none font-bold`} style={{ fontFamily: 'Fraunces, serif' }}>
        PF
      </span>
    </div>
  )
}

const vaultStats = [
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
      {/* Vault branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24 relative overflow-hidden border-r border-dark-200" style={{ background: 'var(--ink-900)' }}>
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 40px)' }} />
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full blur-[120px]" style={{ background: 'rgba(226,177,83,0.12)' }} />
        <div className="absolute -bottom-40 -left-24 w-[480px] h-[480px] rounded-full blur-[120px]" style={{ background: 'rgba(76,195,138,0.08)' }} />

        <div className="relative z-10 max-w-lg">
          <BrandMark />
          <p className="eyebrow mt-8">Bóveda de tus finanzas</p>
          <h1 className="mt-4 text-6xl font-medium text-dark-800 leading-[1.05]" style={{ fontFamily: 'Fraunces, serif' }}>
            Tu dinero, escrito
            <span className="italic text-primary-500"> con claridad</span>
          </h1>
          <p className="mt-6 text-lg text-dark-500 leading-relaxed max-w-md">
            Ingresos, egresos, deudas y ahorros en un solo libro de cuentas. Sin letra pequeña, sin comisiones ocultas.
          </p>

          <div className="mt-12 space-y-3">
            {vaultStats.map((s) => (
              <div key={s.label} className="flex items-center gap-4 py-3 border-b border-dark-200">
                <span className="fig text-2xl text-primary-500 w-16">{s.value}</span>
                <span className="text-sm text-dark-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-16 text-[11px] tracking-[0.2em] uppercase text-dark-400" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
          Portal Financiero · Libro Mayor v2
        </p>
      </div>

      {/* Access slip */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark small />
            <div className="leading-tight">
              <span className="block text-xl font-semibold text-dark-800" style={{ fontFamily: 'Fraunces, serif' }}>Portal Financiero</span>
              <span className="block text-[10px] tracking-[0.2em] uppercase text-dark-500" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>Bóveda personal</span>
            </div>
          </div>

          <div className="slip p-8 animate-slide-up">
            <div className="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase text-[#6f6a55]" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
              <span>Portal Financiero</span>
              <span>No. 0001</span>
            </div>
            <p className="mt-1 text-[11px] tracking-[0.16em] uppercase text-[#6f6a55]" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
              Acceso a la bóveda
            </p>
            <div className="my-6" style={{ borderTop: '2px dashed rgba(38,40,31,0.3)' }} />

            <h2 className="text-3xl font-medium" style={{ color: '#26281f', fontFamily: 'Fraunces, serif' }}>
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#6f6a55' }}>
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#6f6a55', fontFamily: '"IBM Plex Mono", monospace' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="slip-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#6f6a55', fontFamily: '"IBM Plex Mono", monospace' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="slip-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: '#8a8168' }}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-base font-semibold rounded-xl text-[#1a1407] transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg, #e9bd66, #d9a440)', border: '1px solid #b3872f', boxShadow: '0 10px 24px -12px rgba(179,135,47,0.5)' }}
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#1a1407]/50 border-t-[#1a1407] rounded-full animate-spin align-middle" />
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-sm" style={{ color: '#6f6a55' }}>
              <span>¿No tienes cuenta?</span>
              <Link to="/register" className="font-semibold underline underline-offset-4" style={{ color: '#8a6a1f' }}>
                Regístrate aquí
              </Link>
            </div>

            <div className="mt-7 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#8a8168]" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
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
