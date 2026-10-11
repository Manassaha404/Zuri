"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  GraduationCap,
  Mail,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/15";

  function requestOtp() {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setOtp("");
    setStep("otp");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (step === "email") {
      requestOtp();
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (otp !== "123456") {
      setError("Invalid verification code. Try 123456.");
      return;
    }

    setLoading(true);
    window.location.assign("/dashboard");
  }

  function changeEmail() {
    setStep("email");
    setOtp("");
    setError("");
    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-lime-400 selection:text-zinc-950">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-lime-400/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-lime-400/[0.04] blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/80">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400 text-zinc-950">
              <Zap size={21} fill="currentColor" />
            </span>

            <span className="text-xl font-bold tracking-tight">
              FRIDAY<span className="text-lime-400">.</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-lime-400"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-12">
        {/* Left section */}
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/[0.07] px-3 py-2 text-lime-300">
            <Sparkles size={15} />
            <span className="text-[10px] font-semibold tracking-[0.12em] sm:text-xs">
              GOOD TO HAVE YOU BACK
            </span>
          </div>

          <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            YOUR SPACE.
            <br />
            YOUR PLANS.
            <br />
            <span className="text-lime-400">YOUR FUTURE.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-zinc-400 sm:text-base">
            Pick up where you left off. Your notes, plans, habits, and goals
            are waiting for you.
          </p>

          <div className="mt-8 hidden space-y-4 sm:block">
            {[
              "Get back to your semester plan.",
              "Keep your notes and ideas together.",
              "Make progress on what matters.",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-lime-400/30 bg-lime-400/10 text-lime-400">
                  <Check size={14} strokeWidth={2.5} />
                </span>

                <span className="text-sm font-medium text-zinc-300">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 hidden max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:block">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-lime-400">
                <GraduationCap size={23} />
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  One space. More progress.
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Your next chapter continues here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
            {/* Card heading */}
            <div className="border-b border-zinc-800 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-lime-400/10 text-lime-400">
                  {step === "email" ? (
                    <UserRound size={23} />
                  ) : (
                    <Mail size={23} />
                  )}
                </div>

                <span className="rounded-full border border-zinc-700 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-zinc-400">
                  {step === "email" ? "WELCOME BACK" : "EMAIL VERIFICATION"}
                </span>
              </div>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {step === "email" ? (
                  <>
                    Log in to <span className="text-lime-400">FRIDAY.</span>
                  </>
                ) : (
                  "Check your email."
                )}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {step === "email"
                  ? "Continue with Google or enter your email address to get started."
                  : `Enter the 6-digit verification code for ${email}.`}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-7"
            >
              {step === "email" ? (
                <>
                  {/* Google button: demo placeholder */}
                  <button
                    type="button"
                    onClick={() =>
                      setError("Google sign-in is not enabled in this demo.")
                    }
                    className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    <svg
                      viewBox="0 0 48 48"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.3 0 24 0 14.6 0 6.5 5.4 3 13.3l7.8 6.1C12.7 13.7 17.9 9.5 24 9.5Z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.1 24.5c0-1.6-.2-3.2-.5-4.7H24v9h12.4c-.6 3-2.3 5.5-4.8 7.2l7.8 6C43.9 37.9 46.1 31.8 46.1 24.5Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.8 28.7A14.5 14.5 0 0 1 10 24c0-1.6.3-3.2.8-4.7L3 13.3A24 24 0 0 0 0 24c0 3.9.9 7.5 3 10.7l7.8-6Z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.3 0 11.6-2.1 15.4-6l-7.8-6c-2.1 1.4-4.7 2.2-7.6 2.2-6.1 0-11.3-4.2-13.2-9.9L3 34.7C6.5 42.6 14.6 48 24 48Z"
                      />
                    </svg>

                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-800" />
                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500">
                      OR CONTINUE WITH EMAIL
                    </span>
                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-semibold tracking-wide text-zinc-300"
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
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        placeholder="you@example.com"
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>

                  {/* Continue */}
                  <button
                    type="submit"
                    className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300"
                  >
                    Continue with email
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </>
              ) : (
                <>
                  {/* Demo verification notice */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-lime-400/10 text-lime-400">
                      <Mail size={22} />
                    </div>

                    <p className="text-sm font-medium text-zinc-200">
                      Verification code
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Demo mode: use 123456 to continue.
                    </p>
                  </div>

                  {/* OTP input */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-xs font-semibold tracking-wide text-zinc-300"
                    >
                      6-DIGIT VERIFICATION CODE
                    </label>

                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(event) => {
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        );
                        setError("");
                      }}
                      placeholder="000000"
                      className={`${inputClass} py-4 text-center text-xl tracking-[0.5em]`}
                    />
                  </div>

                  {/* Verify */}
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-4 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Continuing..." : "Verify and continue"}

                    {!loading && (
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    )}
                  </button>

                  {/* OTP actions */}
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtp("");
                        setError("");
                      }}
                      className="font-medium text-lime-400 transition hover:text-lime-300"
                    >
                      Try again
                    </button>

                    <span className="text-zinc-700">•</span>

                    <button
                      type="button"
                      onClick={changeEmail}
                      className="text-zinc-400 transition hover:text-zinc-200"
                    >
                      Change email
                    </button>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-5 text-red-300"
                >
                  {error}
                </p>
              )}

              {/* Legal links */}
              <p className="text-center text-xs leading-6 text-zinc-500">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-zinc-300 underline underline-offset-4 transition hover:text-lime-400"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-zinc-300 underline underline-offset-4 transition hover:text-lime-400"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            {/* Signup link */}
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-zinc-800 bg-zinc-950/50 px-4 py-5 text-sm">
              <span className="text-zinc-500">
                Don&apos;t have an account?
              </span>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1 font-semibold text-lime-400 transition hover:text-lime-300"
              >
                Sign up <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] font-medium tracking-[0.15em] text-zinc-600">
            MADE FOR STUDENTS. BUILT FOR YOUR NEXT CHAPTER.
          </p>
        </div>
      </section>
    </main>
  );
}
