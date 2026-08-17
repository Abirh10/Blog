import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { login as authLogin } from '../store/authSlice'
import { Button, Input, Logo } from './index'
import { useDispatch } from 'react-redux'
import authService from '../appwrite/auth'
import { useForm } from 'react-hook-form'

function Login() {
    const dispatch = useDispatch()
    const { register, handleSubmit, formState: { isSubmitting } } = useForm()
    const [error, setError] = useState('')

    const login = async (data) => {
        setError('')
        try {
            const session = await authService.login(data)
            if (session) {
                const userData = await authService.getCurrentUser()
                // No navigate() here on purpose — this form only ever renders
                // inside <AuthLayout authentication={false} redirectTo="/about-me">
                // (see main.jsx), which is already watching authStatus and
                // redirects itself the instant this dispatch flips it. Calling
                // navigate() here too raced that same effect and was losing.
                if (userData) dispatch(authLogin({ userData }))
            }
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div className="flex w-full items-center justify-center px-4 py-16">
            <div className="w-full max-w-md rounded-2xl border border-border-soft bg-paper-elevated p-8 shadow-sm animate-fade-up">
                <div className="mb-6 flex justify-center">
                    <Logo variant="mark" />
                </div>
                <h2 className="text-center font-display text-2xl font-semibold text-ink">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-ink-muted">
                    Don&apos;t have an account?&nbsp;
                    <Link to="/signup" className="font-medium text-accent hover:underline underline-offset-4">
                        Sign up
                    </Link>
                </p>
                {error && (
                    <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
                        {error}
                    </p>
                )}
                <form onSubmit={handleSubmit(login)} className="mt-8">
                    <div className="space-y-5">
                        <Input
                            label="Email"
                            placeholder="you@example.com"
                            type="email"
                            {...register('email', {
                                required: true,
                                validate: {
                                    matchPatern: (value) =>
                                        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                                        'Email address must be a valid address',
                                },
                            })}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            {...register('password', { required: true })}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login
