"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect to homepage
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/");
      }
    });
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Invalid email or password.");
    } else if (data.session) {
      router.push("/");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (signUpError) {
      setErrorMsg(signUpError.message);
      setLoading(false);
      return;
    }

    // If signup returned a session directly (email confirm OFF), go to homepage
    if (signUpData.session) {
      router.push("/");
      return;
    }

    // Email confirm OFF but session not returned — try signing in immediately
    if (signUpData.user && !signUpData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setLoading(false);

      if (signInError) {
        setSuccessMsg(
          "Account created! Please check your email inbox to confirm your account, then sign in."
        );
        setTab("signin");
      } else if (signInData.session) {
        router.push("/");
      }
      return;
    }

    setLoading(false);
    setSuccessMsg("Account created! Please check your email to confirm, then sign in.");
    setTab("signin");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <Link href="/" className="inline-block relative h-20 w-64 overflow-hidden mb-2">
            <Image
              src="/logo.jpeg"
              alt="The Right Path Consultants"
              fill
              priority
              className="object-contain scale-[1.7]"
            />
          </Link>
          <h2 className="mt-2 text-center text-2xl font-bold font-display text-ink">
            {tab === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="mt-1 text-center text-sm text-ink/70">
            {tab === "signin"
              ? "Access your dashboard and enquiry status"
              : "Register to manage consultations & tracking"}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-ink/5 rounded-2xl border border-ink/10 sm:px-10">
          {/* Tab Switcher */}
          <div className="flex rounded-full bg-paper p-1 mb-6 border border-ink/10">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-center text-sm font-semibold rounded-full transition-all ${
                tab === "signin"
                  ? "bg-ink text-white shadow-sm"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-center text-sm font-semibold rounded-full transition-all ${
                tab === "signup"
                  ? "bg-ink text-white shadow-sm"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-3.5 text-sm text-green-800 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            {tab === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="form-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="form-field"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="form-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/75">
                  Password
                </label>
                {tab === "signin" && (
                  <span className="text-xs text-navy font-semibold hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink/50 hover:text-ink text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand font-bold text-ink hover:brightness-105 active:scale-[0.99] transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : tab === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Back link */}
          <div className="mt-6 pt-6 border-t border-ink/10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70 hover:text-ink transition-colors"
            >
              <span>← Back to main website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
