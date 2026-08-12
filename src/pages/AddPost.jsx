import React from 'react'
import { Container, PostForm } from '../components'

function AddPost() {
    return (
        <div className="py-10">
            <Container>
                <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Write a new post</h1>
                <PostForm />
            </Container>
        </div>
    )
}

export default AddPost
