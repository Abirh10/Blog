import React, { useState, useEffect } from 'react'
import { Container, PostCard } from '../components'
import appwriteService from '../appwrite/config'

function AllPosts() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        appwriteService.getPosts([]).then((response) => {
            if (response) setPosts(response.documents)
            setLoading(false)
        })
    }, [])

    return (
        <div className="w-full py-12">
            <Container>
                <h1 className="mb-10 font-display text-3xl font-semibold text-ink">All posts</h1>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border-soft bg-surface" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border-soft bg-surface/40 py-16 text-center">
                        <p className="font-display text-xl text-ink">Nothing published yet</p>
                        <p className="mt-2 text-sm text-ink-muted">Check back soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <PostCard key={post.$id} {...post} />
                        ))}
                    </div>
                )}
            </Container>
        </div>
    )
}

export default AllPosts
