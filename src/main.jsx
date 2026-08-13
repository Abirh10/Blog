import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/store.js'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthLayout, Login } from './components/index.js'

import Home from './pages/Home'
import AddPost from './pages/AddPost'
import Signup from './pages/Signup'
import EditPost from './pages/EditPost'
import Post from './pages/Post'
import AllPosts from './pages/AllPosts'
import NotFound from './pages/NotFound'
import AboutMe from './pages/AboutMe'
import BackgroundPixelStarsDemo from './components/ui/background-pixel-stars.demo'
import StarshipShaderDemo from './components/ui/starship-shader.demo'

const router = createBrowserRouter([
    // Standalone showcase routes for shadcn-style background components —
    // rendered full-bleed, outside the blog's Header/Footer chrome.
    {
        path: '/stars-demo',
        element: <BackgroundPixelStarsDemo />,
    },
    {
        path: '/shader-demo',
        element: <StarshipShaderDemo />,
    },
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: '/login',
                element: (
                    <AuthLayout authentication={false}>
                        <Login />
                    </AuthLayout>
                ),
            },
            {
                path: '/signup',
                element: (
                    <AuthLayout authentication={false}>
                        <Signup />
                    </AuthLayout>
                ),
            },
            {
                path: '/all-posts',
                element: (
                    <AuthLayout authentication>
                        <AllPosts />
                    </AuthLayout>
                ),
            },
            {
                path: '/add-post',
                element: (
                    <AuthLayout authentication>
                        <AddPost />
                    </AuthLayout>
                ),
            },
            {
                path: '/edit-post/:slug',
                element: (
                    <AuthLayout authentication>
                        <EditPost />
                    </AuthLayout>
                ),
            },
            {
                path: '/post/:slug',
                element: <Post />,
            },
            {
                path: '/about-me',
                element: (
                    <AuthLayout authentication>
                        <AboutMe />
                    </AuthLayout>
                ),
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </React.StrictMode>
)
