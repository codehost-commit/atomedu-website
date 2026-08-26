import { getSessionUser } from "../lib/auth";
import { Logo } from "./Logo";

const appLinks: [string, string][] = [
  ["Dashboard", "/dashboard"],
  ["Assignments", "/assignments"],
  ["Create", "/create"],
  ["About", "/about"],
];

const marketingLinks: [string, string][] = [
  ["About", "/about"],
  ["How it works", "/use"],
  ["Features", "/features"],
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function Nav({ current }: { current?: string }) {
  const user = await getSessionUser();
  const links = user ? appLinks : marketingLinks;

  return (
    <header className="topbar">
      <div className="container">
        <a className="wordmark" href={user ? "/dashboard" : "/"}>
          <Logo compact />
        </a>
        <nav className="nav-links">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={current === label ? "active" : ""}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          {user ? (
            <>
              <a className="btn btn-ink btn-sm" href="/create">
                Create
              </a>
              {user.isAdmin && (
                <a className="textlink" href="/admin">
                  Admin
                </a>
              )}
              <a className="textlink" href="/settings">
                Settings
              </a>
              <span className="who">
                <span className="avatar" aria-hidden="true">
                  {initials(user.name ?? user.email)}
                </span>
                <form method="post" action="/api/auth/logout">
                  <button className="signout" type="submit">
                    Sign out
                  </button>
                </form>
              </span>
            </>
          ) : (
            <>
              <a className="textlink" href="/login">
                Sign in
              </a>
              <a className="btn btn-primary btn-sm" href="/login?mode=signup">
                Sign up
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
