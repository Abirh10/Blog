import React from 'react'
import { useDispatch } from 'react-redux'
import authService from '../../appwrite/auth'
import { logout } from '../../store/authSlice'

function LogoutBtn({ className = '' }) {
    const dispatch = useDispatch()
    const logoutHandler = () => {
        authService.logout().then(() => {
            dispatch(logout())
        })
    }
    return (
        <button
            className={`rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-surface hover:text-ink cursor-pointer ${className}`}
            onClick={logoutHandler}
        >
            Logout
        </button>
    )
}

export default LogoutBtn
