"use client";

import { useEffect } from "react";
import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <section className="hero">
        <h1>Something went wrong</h1>
        <p className="subtle">
          An unexpected error occurred while loading this page. You can try again or return home.
        </p>
      </section>
      <section className="section">
        <div className="card">
          <p className="subtle">
            {error.message ? `Details: ${error.message}` : "Details not available."}
          </p>
          <div className="cta-row">
            <button type="button" className="btn-primary" onClick={reset}>
              Try again
            </button>
            <Link className="link-secondary" href="/">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}