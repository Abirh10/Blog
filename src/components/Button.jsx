import React from "react";

const variants = {
    solid: "bg-accent text-accent-ink hover:-translate-y-0.5 hover:brightness-105 shadow-sm",
    outline: "border border-border-soft text-ink hover:bg-surface",
    ghost: "text-ink hover:bg-surface",
    danger: "bg-danger text-white hover:brightness-105",
};

export default function Button({
    children,
    type = "button",
    variant = "solid",
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${variants[variant] ?? variants.solid} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
