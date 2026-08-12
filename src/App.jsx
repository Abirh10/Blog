import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import authService from './appwrite/auth'
import { login, logout } from './store/authSlice'
import { Header, Footer } from './components'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import BackgroundPixelStars from './components/ui/background-pixel-stars'

function AppShell() {
    const { theme } = useTheme()
    const location = useLocation()

    // The starfield is a night-sky effect: on in dark mode everywhere, and
    // always on for the About Me page (which forces its own dark palette
    // locally regardless of the site-wide theme — see AboutMe.jsx).
    const showStars = theme === 'dark' || location.pathname === '/about-me'

    return (
        <div className="flex min-h-screen flex-col text-ink">
            {showStars && <BackgroundPixelStars />}
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

function App() {
    const [loading, setLoading] = useState(true)
    const dispatch = useDispatch()

    useEffect(() => {
        authService
            .getCurrentUser()
            .then((userData) => {
                if (userData) {
                    dispatch(login({ userData }))
                } else {
                    dispatch(logout())
                }
            })
            .finally(() => setLoading(false))
    }, [dispatch])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-soft border-t-accent" />
            </div>
        )
    }

    return (
        <ThemeProvider>
            <AppShell />
        </ThemeProvider>
    )
}

export default App
