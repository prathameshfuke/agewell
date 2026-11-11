import { Navigate } from 'react-router-dom'

// Retired mock screen with invented vitals. Real readings live on the health page.
export default function HealthReport() {
  return <Navigate to="/elder/health" replace />
}
