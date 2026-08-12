import React, { useId } from "react";

const Input = React.forwardRef(function Input(
    { label, type = "text", className = "", ...props },
    ref
) {
    const id = useId();
    return (
        <div className="w-full">
            {label && (
                <label className="mb-1.5 inline-block pl-0.5 text-sm font-medium text-ink-muted" htmlFor={id}>
                    {label}
                </label>
            )}
            <input
                type={type}
                ref={ref}
                id={id}
                className={`w-full rounded-xl border border-border-soft bg-paper-elevated px-3.5 py-2.5 text-ink outline-none transition-colors duration-200 placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent-soft ${className}`}
                {...props}
            />
        </div>
    );
});

export default Input;
