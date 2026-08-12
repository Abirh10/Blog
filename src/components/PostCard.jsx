import React from 'react'
import appwriteService from '../appwrite/config'
import { Link } from 'react-router-dom'

function PostCard({ $id, title, featuredImage, $createdAt }) {
    return (
        <Link to={`/post/${$id}`} className="group block">
            <div className="overflow-hidden rounded-2xl border border-border-soft bg-paper-elevated transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
                    <img
                        src={appwriteService.getFilePreview(featuredImage)}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <div className="p-4">
                    {$createdAt && (
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
                            {new Date($createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                    )}
                    <h2 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-accent">
                        {title}
                    </h2>
                </div>
            </div>
        </Link>
    )
}

export default PostCard
