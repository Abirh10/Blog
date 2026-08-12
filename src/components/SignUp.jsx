import React, { useState } from 'react'
import authService from '../appwrite/auth'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store/authSlice'
import { Button, Input, Logo } from './index'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'

function Signup() {
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const dispatch = useDispatch()
    const { register, handleSubmit, formState: { isSubmitting } } = useForm()

    const create = async (data) => {
        setError('')
        try {
            const userAccount = await authService.createAccount(data)
            if (userAccount) {
                const userData = await authService.getCurrentUser()
                if (userData) dispatch(login({ userData }))
                navigate('/about-me')
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
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-ink-muted">
                    Already have an account?&nbsp;
                    <Link to="/login" className="font-medium text-accent hover:underline underline-offset-4">
                        Sign in
                    </Link>
                </p>
                {error && (
                    <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
                        {error}
                    </p>
                )}
                <form onSubmit={handleSubmit(create)} className="mt-8">
                    <div className="space-y-5">
                        <Input
                            label="Full name"
                            placeholder="Enter your full name"
                            {...register('name', { required: true })}
                        />
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
                            {isSubmitting ? 'Creating account…' : 'Create account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Signup
