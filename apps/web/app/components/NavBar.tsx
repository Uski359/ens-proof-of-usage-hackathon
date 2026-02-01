import Link from "next/link";

export default function NavBar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-links">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/demo/proof">
            Demo
          </Link>
          <a
            className="nav-link"
            href="https://github.com/<owner>/<repo>"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}