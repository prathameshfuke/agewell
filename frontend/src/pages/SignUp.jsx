import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * SignUp page - Redirects to Auth page with signup mode
 * This is a simple redirect to consolidate auth UX
 */
export default function SignUp() {
    const navigate = useNavigate()

    useEffect(() => {
        // Redirect to auth page - the tab will be set to signup there
        navigate('/auth', { replace: true })
    }, [navigate])

    return null
}
