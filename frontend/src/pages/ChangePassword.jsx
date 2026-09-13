import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { KeyIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function ChangePassword() {
  const { changePassword } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Contraseña actualizada')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-dark-900">Cambiar contraseña</h1>
        <p className="text-dark-500 mt-1">Actualiza la clave de acceso a tu cuenta</p>
      </div>

      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
            <KeyIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-dark-900">Nueva contraseña</h3>
            <p className="text-sm text-dark-500">Mínimo 8 caracteres</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="cp-current" className="input-label">Contraseña actual</label>
            <input
              id="cp-current"
              type={show ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="cp-new" className="input-label">Nueva contraseña</label>
            <div className="relative">
              <input
                id="cp-new"
                type={show ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-dark-400 hover:text-dark-700 transition-colors"
              >
                {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="cp-confirm" className="input-label">Confirmar nueva contraseña</label>
            <input
              id="cp-confirm"
              type={show ? 'text' : 'password'}
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-dark-50 rounded-xl text-sm text-dark-600">
            <ShieldCheckIcon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span>Al cambiar la contraseña se cerrarán todas tus demás sesiones por seguridad.</span>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin align-middle" /> : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
