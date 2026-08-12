import React from "react";
import { Link } from "react-router-dom";
import { Container } from "../components";

function NotFound() {
    return (
        <Container>
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center py-20">
                <span className="font-display text-7xl font-semibold text-accent">404</span>
                <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
                    This page wandered off
                </h1>
                <p className="mt-2 max-w-sm text-ink-muted">
                    The page you're looking for doesn't exist or may have been moved.
                </p>
                <Link
                    to="/"
                    className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5"
                >
                    Back to home
                </Link>
            </div>
        </Container>
    );
}

export default NotFound;
