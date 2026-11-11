import { Navigate } from 'react-router-dom'

// Retired mock screen. The real flow lives at /elder/emergency.
export default function EmergencyWellness() {
  return <Navigate to="/elder/emergency" replace />
}
