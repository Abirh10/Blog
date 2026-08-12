import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Container, PostCard } from "../components";
import appwriteService from "../appwrite/config";

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const authStatus = useSelector((state) => state.auth.status);

    useEffect(() => {
        appwriteService.getPosts().then((response) => {
            if (response) setPosts(response.documents);
            setLoading(false);
        });
    }, []);

    return (
        <div className="w-full">
            <section className="bg-grain relative overflow-hidden border-b border-border-soft">
                <div
                    className="pointer-events-none absolute -top-24 right-[-10%] h-80 w-80 rounded-full opacity-30 blur-3xl"
                    style={{ background: "var(--color-accent)" }}
                />
                <Container>
                    <div className="relative z-10 py-20 md:py-28 max-w-2xl animate-fade-up">
                        <span className="inline-block mb-5 rounded-full border border-border-soft bg-surface px-3 py-1 text-xs font-medium uppercase tracking-widest text-ink-muted">
                            Writing on code, craft &amp; the odd tangent
                        </span>
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] text-ink">
                            About Abir Hirani
                        </h1>
                        <p className="mt-6 text-lg text-ink-muted leading-relaxed">
                            Notes, essays and field reports from building software — shared here
                            in the open, one post at a time.
                        </p>
                        {!authStatus && (
                            <div className="mt-8 flex gap-3">
                                <Link
                                    to="/signup"
                                    className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-0.5"
                                >
                                    Join the blog
                                </Link>
                                <Link
                                    to="/all-posts"
                                    className="rounded-full border border-border-soft px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface"
                                >
                                    Read the posts
                                </Link>
                            </div>
                        )}
                    </div>
                </Container>
            </section>

            <Container>
                <div className="py-16">
                    <div className="mb-10 flex items-end justify-between">
                        <h2 className="font-display text-2xl font-semibold text-ink">
                            Latest posts
                        </h2>
                        {posts.length > 0 && (
                            <Link
                                to="/all-posts"
                                className="text-sm font-medium text-accent hover:underline underline-offset-4"
                            >
                                View all &rarr;
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-72 animate-pulse rounded-2xl border border-border-soft bg-surface"
                                />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border-soft bg-surface/40 py-16 text-center">
                            <p className="font-display text-xl text-ink">No posts published yet</p>
                            <p className="mt-2 text-sm text-ink-muted">
                                {authStatus
                                    ? "Head to Add Post to publish your first one."
                                    : "Check back soon — or sign in to write the first post."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {posts.slice(0, 6).map((post) => (
                                <PostCard key={post.$id} {...post} />
                            ))}
                        </div>
                    )}
                </div>
            </Container>
        </div>
    );
}

export default Home;
