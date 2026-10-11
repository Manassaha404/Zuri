"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";

export default function SigninPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    // Connect your login API here.
    // Example: POST /api/auth/login
    setError("Login API is not connected yet.");
  }

  const inputClass =
    "w-full min-w-0 border-2 border-black bg-white px-4 py-3.5 text-sm font-medium text-[#111] outline-none placeholder:text-zinc-400 focus:bg-[#FFFBE5] focus:ring-2 focus:ring-[#FFE500] focus:ring-offset-1";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F4EC] text-[#111] selection:bg-[#FFE500]">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute -left-16 top-36 h-48 w-48 rotate-12 border-[3px] border-black bg-[#DCE8D5] opacity-70 sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-56 w-56 -rotate-12 border-[3px] border-black bg-[#DED8F5] opacity-70 sm:h-72 sm:w-72" />

      {/* Header */}
      <header className="relative z-10 border-b-2 border-black">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center border-2 border-black bg-[#FFE500] text-xl font-black shadow-[3px_3px_0_#111]">
              F
            </span>

            <span className="text-xl font-black tracking-tight">
              FRIDAY<span className="text-[#B69D00]">.</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black transition-transform hover:-translate-x-1 sm:text-sm"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-12">
        {/* Left section */}
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_#111]">
            <Sparkles size={15} />

            <span className="text-[10px] font-black tracking-[0.12em] sm:text-xs">
              GOOD TO HAVE YOU BACK
            </span>
          </div>

          <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            YOUR SPACE.
            <br />
            YOUR PLANS.
            <br />
            <span className="bg-[#FFE500] px-2">YOUR FUTURE.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-zinc-600 sm:text-base">
            Pick up where you left off. Your notes, plans, habits, and
            goals are waiting for you.
          </p>

          <div className="mt-8 hidden space-y-4 sm:block">
            {[
              "Get back to your semester plan.",
              "Keep your notes and ideas together.",
              "Make progress on what matters.",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center border-2 border-black bg-[#DCE8D5]">
                  <Check size={14} strokeWidth={3} />
                </span>

                <span className="text-sm font-bold">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 hidden max-w-sm border-2 border-black bg-[#FFF0A8] p-4 shadow-[5px_5px_0_#111] sm:block">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center border-2 border-black bg-white">
                <GraduationCap size={23} />
              </div>

              <div>
                <p className="text-sm font-black">
                  One space. More progress.
                </p>

                <p className="mt-1 text-xs font-medium text-zinc-600">
                  Your next chapter continues here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="mx-auto w-full max-w-lg">
          <div className="border-[3px] border-black bg-white shadow-[7px_7px_0_#111] sm:shadow-[10px_10px_0_#111]">
            <div className="border-b-[3px] border-black bg-[#FFE500] p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center border-2 border-black bg-white">
                  <UserRound size={22} />
                </div>

                <span className="border-2 border-black bg-white px-2.5 py-1 text-[10px] font-black tracking-wider">
                  WELCOME BACK
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Log in to Friday.
              </h2>

              <p className="mt-2 text-sm font-medium text-zinc-700">
                Your workspace is just one step away.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-black"
                >
                  EMAIL ADDRESS
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(event) => {
                      setForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }));
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-black"
                  >
                    PASSWORD
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold underline underline-offset-2 hover:text-zinc-500"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={(event) => {
                      setForm((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }));
                      setError("");
                    }}
                    placeholder="Enter your password"
                    className={`${inputClass} pl-11 pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-600 hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  className="h-4 w-4 shrink-0 accent-black"
                />

                <span className="text-xs font-medium text-zinc-600">
                  Remember me on this device
                </span>
              </label>

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  className="border-2 border-black bg-[#F8DCD0] p-3 text-xs font-bold leading-5"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex min-h-14 w-full items-center justify-center gap-2 border-2 border-black bg-[#FFE500] px-5 py-4 text-sm font-black shadow-[4px_4px_0_#111] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log in to my account"}

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <p className="text-center text-xs leading-6 text-zinc-500">
                Your space to think, plan, and make progress.
              </p>
            </form>

            {/* Signup link */}
            <div className="flex flex-wrap items-center justify-center gap-1 border-t-2 border-black bg-[#F7F4EC] px-4 py-5 text-sm">
              <span className="text-zinc-600">
                Don't have an account?
              </span>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1 font-black underline decoration-2 underline-offset-4 hover:text-zinc-600"
              >
                Sign up <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] font-black tracking-[0.15em] text-zinc-500">
            MADE FOR STUDENTS. BUILT FOR YOUR NEXT CHAPTER.
          </p>
        </div>
      </section>
    </main>
  );
}
