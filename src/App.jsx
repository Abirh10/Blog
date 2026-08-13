import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import authService from './appwrite/auth'
import { login, logout } from './store/authSlice'
import { Header, Footer } from './components'
import { ThemeProvider } from './context/ThemeContext'
import { Component as StarshipShader } from './components/ui/starship-shader'
import { StarsBackground } from './components/ui/stars-background'

function AppShell() {
    // One consistent backdrop everywhere — every route, both themes — is
    // what makes this read as a deliberate site identity instead of "Home
    // has decoration and nothing else does." Golden streaks (the shader) as
    // the base layer, real depth-simulating stars drifting on top. Individual
    // pages' own content sits on opaque surfaces above it exactly like
    // before; this only changes what shows through the gaps.
    //
    // No pointer-events-none on this wrapper (unlike the layer it replaced):
    // StarsBackground tracks the pointer for its parallax drift, which needs
    // real mousemove events to reach it. That's safe — this is the backmost
    // (-z-10) layer, so real UI content, which paints on top in normal flow,
    // still receives every click/hover exactly as before; only truly empty
    // page gaps now also respond to the mouse.
    return (
        <div className="flex min-h-screen flex-col text-ink">
            <div className="fixed inset-0 -z-10">
                <StarshipShader />
                <StarsBackground className="absolute inset-0" />
            </div>
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
