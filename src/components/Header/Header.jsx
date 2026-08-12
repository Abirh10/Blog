import React, { useState } from 'react'
import { Container, Logo, LogoutBtn, ThemeToggle } from '../index'
import { Link, NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

function Header() {
    const authStatus = useSelector((state) => state.auth.status)
    const [menuOpen, setMenuOpen] = useState(false)

    const navItems = [
        { name: 'Home', slug: '/', active: true },
        { name: 'All Posts', slug: '/all-posts', active: authStatus },
        { name: 'Add Post', slug: '/add-post', active: authStatus },
        { name: 'About Me', slug: '/about-me', active: authStatus },
        { name: 'Login', slug: '/login', active: !authStatus },
        { name: 'Signup', slug: '/signup', active: !authStatus },
    ]

    const linkClass = ({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            isActive ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
        }`

    return (
        <header className="sticky top-0 z-40 border-b border-border-soft bg-paper/85 backdrop-blur-md">
            <Container>
                <nav className="flex items-center justify-between py-4">
                    <Link to="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
                        <Logo />
                    </Link>

                    <ul className="hidden md:flex items-center gap-1">
                        {navItems.map((item) =>
                            item.active ? (
                                <li key={item.name}>
                                    <NavLink to={item.slug} end={item.slug === '/'} className={linkClass}>
                                        {item.name}
                                    </NavLink>
                                </li>
                            ) : null
                        )}
                        {authStatus && (
                            <li>
                                <LogoutBtn />
                            </li>
                        )}
                    </ul>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            aria-label="Toggle menu"
                            onClick={() => setMenuOpen((v) => !v)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink md:hidden cursor-pointer"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                            </svg>
                        </button>
                    </div>
                </nav>

                {menuOpen && (
                    <ul className="flex flex-col gap-1 border-t border-border-soft py-3 md:hidden">
                        {navItems.map((item) =>
                            item.active ? (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.slug}
                                        end={item.slug === '/'}
                                        onClick={() => setMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `block rounded-lg px-3 py-2 text-sm font-medium ${
                                                isActive ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:bg-surface'
                                            }`
                                        }
                                    >
                                        {item.name}
                                    </NavLink>
                                </li>
                            ) : null
                        )}
                        {authStatus && (
                            <li>
                                <LogoutBtn className="w-full justify-start px-3" />
                            </li>
                        )}
                    </ul>
                )}
            </Container>
        </header>
    )
}

export default Header
