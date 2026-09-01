import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Logo, Button } from "../components/ui";
import { Icon } from "../components/Icon";
import { cn } from "../utils";
import { useAuth } from "../context/StoreContext";
import { PRODUCT_NAME } from "../config/brand";

const NAV = [
  { label: "Platform", href: "/#platform" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Blueprint", href: "/#blueprint" },
  { label: "About", to: "/about" },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-light [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-pine-200/40 blur-[110px]" />
        <div className="absolute top-1/3 -left-40 h-[380px] w-[380px] rounded-full bg-gold-200/30 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-ink-100/80 bg-paper-100/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label={`${PRODUCT_NAME} home`}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((n) =>
              n.to ? (
                <NavLink
                  key={n.label}
                  to={n.to}
                  className={({ isActive }) =>
                    cn("rounded-md px-3 py-2 text-sm font-medium transition", isActive ? "bg-ink-900/5 text-ink-900" : "text-ink-500 hover:text-ink-900")
                  }
                >
                  {n.label}
                </NavLink>
              ) : (
                <a key={n.label} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink-500 transition hover:text-ink-900">
                  {n.label}
                </a>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Button size="sm" iconRight="arrowRight" onClick={() => navigate(user.role === "faculty" ? "/faculty" : "/app")} className="h-9">
                Open workspace
              </Button>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink-600 transition hover:text-ink-900">
                  Log in
                </Link>
                <Link to="/register">
                  <Button size="sm" className="h-9" iconRight="arrowRight">
                    Start Your Project
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-900/5 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-ink-100 md:hidden"
              aria-label="Mobile"
            >
              <div className="space-y-1 px-4 py-4">
                {NAV.map((n) => (
                  <a key={n.label} href={n.to ?? n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-900/5">
                    {n.label}
                  </a>
                ))}
                <div className="flex gap-2 pt-3">
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full">Start Your Project</Button>
                  </Link>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main key={location.pathname}>
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-ink-100 bg-ink-950 text-paper-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-50/60">
              An agentic AI platform that tracks academic projects from the first idea to final submission — plan, build, document, track.
            </p>
            <p className="mt-5 font-mono text-[10.5px] tracking-wider text-paper-50/40 uppercase">React frontend · FastAPI + PostgreSQL backend</p>
          </div>
          <FooterCol title="Platform" links={[["Idea evaluation", "/#platform"], ["Scope & technology", "/#blueprint"], ["Risk planning", "/#workflow"], ["Documentation", "/#blueprint"]]} />
          <FooterCol title="Roles" links={[["For students", "/#roles"], ["For faculty", "/#roles"], ["Login", "/login"], ["Register", "/register"]]} />
          <FooterCol title="Product" links={[["About", "/about"], ["Agent pipeline", "/#workflow"], ["Live blueprint", "/#blueprint"]]} />
        </div>
        <div className="border-t border-paper-50/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-paper-50/45 sm:px-6">
            <span>© {new Date().getFullYear()} {PRODUCT_NAME}</span>
            <span className="font-mono tracking-wider uppercase">Idea → Orchestrator → Submission</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-pine-300 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-sm text-paper-50/65 transition hover:text-paper-50">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
