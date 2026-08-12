import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/config";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const { slug } = useParams();
    const navigate = useNavigate();

    const userData = useSelector((state) => state.auth.userData);

    const isAuthor = post && userData ? post.userId === userData.$id : false;

    useEffect(() => {
        if (slug) {
            appwriteService.getPost(slug).then((post) => {
                if (post) setPost(post);
                else navigate("/");
                setLoading(false);
            });
        } else navigate("/");
    }, [slug, navigate]);

    const deletePost = () => {
        appwriteService.deletePost(post.$id).then((status) => {
            if (status) {
                appwriteService.deleteFile(post.featuredImage);
                navigate("/");
            }
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-soft border-t-accent" />
            </div>
        );
    }

    return post ? (
        <div className="py-10 md:py-14">
            <Container>
                <div className="mx-auto max-w-3xl">
                    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border-soft">
                        <img
                            src={appwriteService.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="max-h-[420px] w-full object-cover"
                        />

                        {isAuthor && (
                            <div className="absolute right-4 top-4 flex gap-2">
                                <Link to={`/edit-post/${post.$id}`}>
                                    <Button variant="solid" className="!bg-paper-elevated !text-ink shadow">
                                        Edit
                                    </Button>
                                </Link>
                                <Button variant="danger" onClick={deletePost}>
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    {post.$createdAt && (
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                            {new Date(post.$createdAt).toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </p>
                    )}
                    <h1 className="mb-8 font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
                        {post.title}
                    </h1>

                    <div className="article-content">{parse(post.content)}</div>
                </div>
            </Container>
        </div>
    ) : null;
}
