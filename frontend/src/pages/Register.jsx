import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ShieldCheckIcon, LockClosedIcon, ChartBarIcon } from '@heroicons/react/24/outline'

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? 'w-10 h-10' : 'w-14 h-14'} rounded-full flex items-center justify-center flex-shrink-0 border shadow-[0_0_0_5px_rgba(108,140,255,0.12),0_0_0_7px_rgba(108,140,255,0.06)]`}
      style={{ background: 'radial-gradient(circle at 35% 30%, #8FA8FF, #4B6BE0 70%)', borderColor: '#4B6BE0' }}
    >
      <span className={`${small ? 'text-base' : 'text-xl'} text-[#08101C] leading-none font-bold`} style={{ fontFamily: '"Sora", sans-serif' }}>
        PF
      </span>
    </div>
  )
}

const benefits = [
  'Control total de ingresos y egresos',
  'Gestión inteligente de deudas',
  'Proyecciones financieras a futuro',
  'Reportes detallados y gráficos',
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await register(email, password, name)
      toast.success('¡Cuenta creada exitosamente!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Vault branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24 relative overflow-hidden border-r border-dark-200" style={{ background: 'var(--ink-900)' }}>
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 40px)' }} />
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full blur-[120px]" style={{ background: 'rgba(108,140,255,0.12)' }} />
        <div className="absolute -bottom-40 -left-24 w-[480px] h-[480px] rounded-full blur-[120px]" style={{ background: 'rgba(55,211,153,0.08)' }} />

        <div className="relative z-10 max-w-lg">
          <BrandMark />
          <p className="eyebrow mt-8">Abre tu cuenta</p>
          <h1 className="mt-4 text-6xl font-medium text-dark-800 leading-[1.05]" style={{ fontFamily: '"Sora", sans-serif' }}>
            Escribe el primer capítulo
            <span className="italic text-primary-500"> de tu dinero</span>
          </h1>
          <p className="mt-6 text-lg text-dark-500 leading-relaxed max-w-md">
            Únete y transforma la forma en que administras tu dinero. Sin comisiones, sin letra pequeña.
          </p>

          <div className="mt-10 space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 py-2 border-b border-dark-200">
                <span className="fig text-xs text-primary-500 w-8">{String(index + 1).padStart(2, '0')}</span>
                <CheckCircleIcon className="h-5 w-5 text-success-500" />
                <span className="text-sm text-dark-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-16 text-[11px] tracking-[0.2em] uppercase text-dark-400" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Portal Financiero · Libro Mayor v2
        </p>
      </div>

      {/* Access slip */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark small />
            <div className="leading-tight">
              <span className="block text-xl font-semibold text-dark-800" style={{ fontFamily: '"Sora", sans-serif' }}>Portal Financiero</span>
              <span className="block text-[10px] tracking-[0.2em] uppercase text-dark-500" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Bóveda personal</span>
            </div>
          </div>

          <div className="slip p-8 animate-slide-up">
            <div className="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase text-[#8794A8]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <span>Portal Financiero</span>
              <span>No. 0002</span>
            </div>
            <p className="mt-1 text-[11px] tracking-[0.16em] uppercase text-[#8794A8]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              Apertura de cuenta
            </p>
            <div className="my-6" style={{ borderTop: '2px dashed rgba(30,40,55,0.6)' }} />

            <h2 className="text-3xl font-medium" style={{ color: '#E8EEF7', fontFamily: '"Sora", sans-serif' }}>
              Crear cuenta
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#8794A8' }}>
              Comienza a administrar tus finanzas hoy
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#8794A8', fontFamily: '"JetBrains Mono", monospace' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="slip-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#8794A8', fontFamily: '"JetBrains Mono", monospace' }}>
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
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#8794A8', fontFamily: '"JetBrains Mono", monospace' }}>
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
                    style={{ color: '#8794A8' }}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: '#8794A8', fontFamily: '"JetBrains Mono", monospace' }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="slip-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-base font-semibold rounded-xl text-[#08101C] transition-all disabled:opacity-60 mt-1"
                style={{ background: 'linear-gradient(180deg, #8FA8FF, #4B6BE0)', border: '1px solid #4B6BE0', boxShadow: '0 10px 24px -12px rgba(108,140,255,0.5)' }}
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#08101C]/50 border-t-[#08101C] rounded-full animate-spin align-middle" />
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-sm" style={{ color: '#8794A8' }}>
              <span>¿Ya tienes cuenta?</span>
              <Link to="/login" className="font-semibold underline underline-offset-4" style={{ color: '#8FA8FF' }}>
                Inicia sesión
              </Link>
            </div>

            <div className="mt-7 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#8794A8]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
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
