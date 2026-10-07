import Link from "next/link";
import { ArrowUpRight, Building2, Menu, MoveVertical } from "lucide-react";
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
          {user?.role !== "COMPANY" && (
            <Link href={user ? "/requirements" : "/sign-in"}>
              {user ? "Find work" : "Sign in to find work"}
            </Link>
          )}
          <Link href="/manpower">Browse manpower</Link>
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
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu />
            </summary>
            <nav>
              {user?.role !== "COMPANY" && (
                <Link href={user ? "/requirements" : "/sign-in"}>
                  {user ? "Find work" : "Sign in to find work"}
                </Link>
              )}
              <Link href="/manpower">Browse manpower</Link>
              <Link href="/workers">Find workers</Link>
              <Link href="/vendors">Manpower vendors</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href={user ? "/dashboard" : "/sign-in"}>
                {user ? "Dashboard" : "Sign in"}
              </Link>
              {user && (
                <form action={logout}>
                  <button className="text-button">Sign out</button>
                </form>
              )}
            </nav>
          </details>
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
export async function Footer() {
  const user = await currentUser();
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
        <Link
          href={
            user?.role === "COMPANY"
              ? "/dashboard/requirements"
              : user
                ? "/requirements"
                : "/sign-in"
          }
        >
          {user?.role === "COMPANY"
            ? "My requirements"
            : user
              ? "Browse requirements"
              : "Sign in to find work"}
        </Link>
        <Link href="/manpower">Browse manpower</Link>
      </nav>
      <small>Built for India’s elevator workforce.</small>
    </footer>
  );
}
