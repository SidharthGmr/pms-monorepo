"use client";

import React from "react";

type ErrorProps = {
    error?: Error & { digest?: string };
    reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
    React.useEffect(() => {
        if (error) {
            // You can log the error to an error reporting service
            console.error("Error caught in ErrorBoundary:", error);
        }
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-100 text-red-800 text-center">
            <h2 className="text-3xl font-bold">Oops, something went wrong!</h2>
            <p className="mt-4 mb-6">
                We&apos;re sorry, but an unexpected error has occurred.
            </p>
            <button
                className="mb-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                type="button"
                onClick={() => reset()}
            >
                Try Again
            </button>
            <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                type="button"
                onClick={() => window.location.href = '/'}
            >
                Go to Home
            </button>
        </div>
    );
}