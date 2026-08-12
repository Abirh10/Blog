import React, { useEffect, useState } from 'react'
import { Container, PostForm } from '../components'
import appwriteService from '../appwrite/config'
import { useNavigate, useParams } from 'react-router-dom'

function EditPost() {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const { slug } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (slug) {
            appwriteService.getPost(slug).then((post) => {
                if (post) setPost(post)
                setLoading(false)
            })
        } else {
            navigate('/')
        }
    }, [slug, navigate])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-soft border-t-accent" />
            </div>
        )
    }

    return post ? (
        <div className="py-10">
            <Container>
                <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Edit post</h1>
                <PostForm post={post} />
            </Container>
        </div>
    ) : null
}

export default EditPost
