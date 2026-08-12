import React, { useId } from "react";

function Select({ options, label, className = "", ...props }, ref) {
    const id = useId();
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-1.5 inline-block pl-0.5 text-sm font-medium text-ink-muted">
                    {label}
                </label>
            )}
            <select
                {...props}
                id={id}
                ref={ref}
                className={`w-full rounded-xl border border-border-soft bg-paper-elevated px-3.5 py-2.5 text-ink outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent-soft ${className}`}
            >
                {options?.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default React.forwardRef(Select);
