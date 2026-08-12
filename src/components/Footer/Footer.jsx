import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../Logo'

function Footer() {
    return (
        <footer className="border-t border-border-soft bg-surface/40">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                        <Logo />
                        <p className="mt-3 max-w-xs text-sm text-ink-muted">
                            Notes, essays and field reports from building software.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm font-medium text-ink-muted">
                        <Link to="/" className="hover:text-ink">
                            Home
                        </Link>
                        <Link to="/all-posts" className="hover:text-ink">
                            Posts
                        </Link>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-ink"
                        >
                            GitHub
                        </a>
                    </div>
                </div>

                <div className="mt-8 border-t border-border-soft pt-6 text-xs text-ink-muted">
                    &copy; {new Date().getFullYear()} Abir Hirani. All rights reserved.
                </div>
            </div>
        </footer>
    )
}

export default Footer
