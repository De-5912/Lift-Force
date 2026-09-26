import Link from "next/link";
import { ArrowUpRight, Building2, MoveVertical } from "lucide-react";
import { currentUser } from "@/lib/data";
import { configured } from "@/lib/supabase/server";
import { logout } from "@/app/actions";

export async function Header() {
  const user = await currentUser();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <MoveVertical size={23} />
          </span>
          liftwork<span className="brand-period">.</span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          <Link href="/requirements">Find work</Link>
          <Link href="/workers">Find workers</Link>
          <Link href="/vendors">Manpower vendors</Link>
          <Link href="/how-it-works">How it works</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link href="/dashboard" className="button secondary">
                Dashboard
              </Link>
              <form action={logout}>
                <button className="text-button">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link className="signin-link" href="/sign-in">
                Sign in
              </Link>
              <Link className="button small" href="/register?role=COMPANY">
                Post a requirement <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>
      </header>
      {!configured() && (
        <div className="demo-bar">
          <span>LOCAL PREVIEW</span> Sample profiles and requirements · Connect
          local Supabase to enable accounts and saved changes.
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link href="/" className="brand">
          <Building2 size={22} />
          liftwork.
        </Link>
        <p>Elevator projects. The right people.</p>
      </div>
      <nav aria-label="Footer">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/requirements">Browse requirements</Link>
      </nav>
      <small>Built for India’s elevator workforce.</small>
    </footer>
  );
}
