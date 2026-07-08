"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  CalendarDays,
  Inbox,
  ListChecks,
  Loader2,
  LogOut,
  Settings2,
  TreePine,
} from "lucide-react";
import { adminFetch, supabaseBrowser } from "@/lib/admin-client";
import { Avatar, Button, ErrorBanner, INPUT_CLASS } from "./ui";

const NAV = [
  { href: "/admin", label: "Payments to check", icon: Inbox },
  { href: "/admin/bookings", label: "All bookings", icon: ListChecks },
  { href: "/admin/calendar", label: "Calendar & blocking", icon: CalendarDays },
  { href: "/admin/settings", label: "Prices & account", icon: Settings2 },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
        <TreePine className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-[14px] font-semibold text-slate-900">Farmhouse</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Admin</p>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) setError("Wrong email or password. Please try again.");
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_16px_rgba(16,24,40,0.06)]">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage bookings and payments.</p>
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
              />
            </div>
            <ErrorBanner message={error} />
            <Button type="submit" loading={busy} className="w-full !py-2.5">
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Only the farm owner can sign in here.
        </p>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    adminFetch<{ bookings: unknown[] }>("/api/admin/bookings?status=payment_review")
      .then((d) => {
        if (!cancelled) setReviewCount(d.bookings.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (!session) return <LoginScreen />;

  const email = session.user.email ?? "";

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900 antialiased">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white md:flex">
        <div className="px-5 pb-2 pt-6">
          <BrandMark />
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin" && (reviewCount ?? 0) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                    {reviewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-800">Farm owner</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
            <button
              onClick={() => supabaseBrowser.auth.signOut()}
              title="Sign out"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <BrandMark />
          <button
            onClick={() => supabaseBrowser.auth.signOut()}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                  active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.label}
                {item.href === "/admin" && (reviewCount ?? 0) > 0 && (
                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active ? "bg-white text-indigo-700" : "bg-indigo-600 text-white"
                    }`}
                  >
                    {reviewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="md:pl-[248px]">
        <div className="mx-auto max-w-[1060px] px-4 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
