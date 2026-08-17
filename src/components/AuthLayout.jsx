import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function Protected({ children, authentication = true, redirectTo = '/' }) {
    const navigate = useNavigate()
    const [loader, setLoader] = useState(true)
    const authStatus = useSelector((state) => state.auth.status)

    useEffect(() => {
        if (authentication && authStatus !== authentication) {
            navigate('/login')
        } else if (!authentication && authStatus !== authentication) {
            // This also fires the instant a guest-only page's own login/signup
            // form succeeds (authStatus flips true while still mounted here) —
            // by design, this is the one place that redirect happens now.
            // Login/SignUp used to also call navigate() themselves right after
            // dispatching, which raced this exact effect (both watch the same
            // authStatus) and this one — hardcoded to '/' — kept winning.
            navigate(redirectTo)
        }
        setLoader(false)
    }, [authStatus, navigate, authentication, redirectTo])

    return loader ? (
        <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-soft border-t-accent" />
        </div>
    ) : (
        <>{children}</>
    )
}
