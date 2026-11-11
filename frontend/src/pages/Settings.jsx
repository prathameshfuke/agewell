import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Legacy /settings route. It only held AI API-key fields, which now live
 * server-side, so it forwards to the settings page of the current role.
 */
export default function Settings() {
  const { activeRole } = useAuth()
  return <Navigate to={activeRole === 'caregiver' ? '/family/settings' : '/elder/settings'} replace />
}
