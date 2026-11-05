
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function InvitationConfirmationPage() {
  const router = useRouter();
  const verificationStarted = useRef(false);

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    // const verifyInvitation = async () => {
    //   try {
    //     const supabase = getSupabaseBrowserClient();

    //     if (!supabase) {
    //       throw new Error("Supabase is not configured.");
    //     }


    //     const params = new URLSearchParams(
    //       window.location.search
    //     );

    //     // Read invitation parameters from the URL fragment
    //     const hashParams = new URLSearchParams(
    //       window.location.hash.substring(1)
    //     );

    //     // Support refreshing after successful verification
    //     if (params.get("verified") === "1") {
    //       const {
    //         data: { session },
    //       } = await supabase.auth.getSession();

    //       if (!session) {
    //         throw new Error(
    //           "Your invitation session has expired. Please request a new invitation."
    //         );
    //       }

    //       setVerified(true);
    //       return;
    //     }

    //     const tokenHash = params.get("token_hash");
    //     const queryType = params.get("type");
    //     const hashType = hashParams.get("type");

    //     // FLOW 1: Token hash verification
    //     if (tokenHash && queryType === "invite") {
    //       const { error: verifyError } =
    //         await supabase.auth.verifyOtp({
    //           token_hash: tokenHash,
    //           type: "invite",
    //         });

    //       if (verifyError) {
    //         throw verifyError;
    //       }
    //     }

    //     // FLOW 2: Access token verification
    //     else if (hashType === "invite") {
    //       // Supabase JS automatically detects the access token
    //       // in the URL fragment and establishes the session.

    //       const {
    //         data: { session },
    //         error: sessionError,
    //       } = await supabase.auth.getSession();

    //       if (sessionError || !session) {
    //         throw new Error(
    //           "Unable to establish your invitation session. Please request a new invitation."
    //         );
    //       }

    //       const {
    //         data: { user },
    //         error: userError,
    //       } = await supabase.auth.getUser();

    //       if (userError || !user) {
    //         throw new Error(
    //           "Unable to verify the invited user."
    //         );
    //       }
    //     }

    //     // Invalid invitation
    //     else {
    //       throw new Error(
    //         "Invalid invitation link. Please use the invitation email sent to you."
    //       );
    //     }

    //     // Remove sensitive authentication tokens from the URL
    //     window.history.replaceState(
    //       {},
    //       "",
    //       "/confirm?verified=1"
    //     );

    //     setVerified(true);

    //   } catch (err) {
    //     setError(
    //       err instanceof Error
    //         ? err.message
    //         : "Unable to verify invitation."
    //     );
    //   } finally {
    //     setLoading(false);
    //   }
    // };


    const verifyInvitation = async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const params = new URLSearchParams(
          window.location.search
        );

        // Support refreshing after successful verification
        if (params.get("verified") === "1") {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error || !session) {
            throw new Error(
              "Your invitation session has expired. Please request a new invitation."
            );
          }

          setVerified(true);
          return;
        }

        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (!tokenHash || type !== "invite") {
          throw new Error(
            "Invalid invitation link. Please use the invitation email sent to you."
          );
        }

        // Explicitly verify the invitation
        const { data, error: verifyError } =
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });

        if (verifyError) {
          throw verifyError;
        }

        if (!data.user || !data.session) {
          throw new Error(
            "Unable to establish the invited user's session."
          );
        }

        // Confirm that the authenticated user is the invited user
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (
          userError ||
          !currentUser ||
          currentUser.id !== data.user.id
        ) {
          throw new Error(
            "Invitation authentication failed. Please request a new invitation."
          );
        }

        console.log("INVITATION VERIFIED:", {
          id: currentUser.id,
          email: currentUser.email,
        });

        // Remove sensitive token from URL
        window.history.replaceState(
          {},
          "",
          "/confirm?verified=1"
        );

        setVerified(true);

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify invitation."
        );
      } finally {
        setLoading(false);
      }
    };

    void verifyInvitation();
  }, []);

  const handleSetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Your invitation session has expired. Please request a new invitation."
        );
      }

      // ==========================================================
      const {
        data: { user: currentUser },
        error: currentUserError,
      } = await supabase.auth.getUser();

      console.log("CURRENT AUTHENTICATED USER:", {
        id: currentUser?.id,
        email: currentUser?.email,
      });

      if (currentUserError || !currentUser) {
        throw new Error("No authenticated user found.");
      }

      // ================================================================

      const { data: updatedUser, error: passwordError } =
        await supabase.auth.updateUser({
          password,
        });

      if (passwordError) {
        console.error("PASSWORD UPDATE ERROR:", passwordError);
        throw passwordError;
      }

      console.log(
        "PASSWORD UPDATED SUCCESSFULLY:",
        updatedUser.user?.email
      );

      setSuccess(true);

      // End invitation session; user will sign in normally
      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login?activated=1");
      }, 1800);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set your password."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#e96b3b] mx-auto" />
          <p className="mt-4 text-sm text-slate-600">
            Verifying your invitation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center px-4 py-12">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="TUCOSWA Logo"
            className="h-16 w-16 rounded-2xl object-cover mx-auto"
          />

          <h1 className="mt-5 text-2xl font-black text-[#173f5f]">
            TUCOSWA
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Management System
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-7 sm:p-9">

          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />

              <h2 className="mt-5 text-xl font-bold text-[#173f5f]">
                Account Activated!
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Your password has been created successfully.
                Redirecting you to the login page...
              </p>
            </div>
          ) : !verified ? (
            <div className="text-center py-6">
              <ShieldCheck className="h-14 w-14 text-red-500 mx-auto" />

              <h2 className="mt-4 text-xl font-bold text-[#173f5f]">
                Invitation Verification Failed
              </h2>

              <p className="mt-3 text-sm text-red-600">
                {error}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Please contact your System Administrator
                to request a new invitation.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <div className="h-14 w-14 rounded-2xl bg-[#173f5f]/10 flex items-center justify-center mx-auto">
                  <LockKeyhole className="h-7 w-7 text-[#173f5f]" />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-[#173f5f]">
                  Set Your Password
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your invitation has been verified.
                  Create a password to activate your account.
                </p>
              </div>

              <form
                onSubmit={handleSetPassword}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-[#173f5f] focus:ring-2 focus:ring-[#173f5f]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-[#173f5f] focus:ring-2 focus:ring-[#173f5f]/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-slate-400"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[#173f5f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0e2c43] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Activating Account...
                    </>
                  ) : (
                    "Set Password & Activate Account"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-400">
                Your password is securely managed by Supabase Authentication.
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} TUCOSWA. All rights reserved.
        </p>

      </div>
    </div>
  );
}
