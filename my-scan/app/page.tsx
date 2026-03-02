"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const isSetupComplete = (session?.user as any)?.isSetupComplete;
      if (isSetupComplete) {
        router.push("/dashboard");
      } else {
        router.push("/setup");
      }
    }
  }, [status, session, router]);

  const handleCMULogin = async () => {
    setIsLoading(true);
    await signIn("cmu-entraid", { callbackUrl: "/dashboard" }, {
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/cmuEntraIDCallback`
    });
  };

  if (status === "loading" || status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-white selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {/* Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Logo Box */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-blue-200 dark:shadow-none">
              VS
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent pb-2">
              VisScan
            </h1>

            <p className="text-lg font-medium leading-relaxed">
              <span className="text-slate-700 dark:text-slate-300 block mb-1">
                Security scanning for modern dev teams.
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                Code, Build, and Ship securely.
              </span>
            </p>
          </div>

          {/* Sign In Button */}
          <div className="pt-2 space-y-4">
            <button
              onClick={handleCMULogin}
              disabled={isLoading}
              className={`w-full group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 
              bg-[#64256F] hover:bg-[#501d59] active:bg-[#3f1746]
              dark:bg-[#7a3c85] dark:hover:bg-[#64256F] dark:active:bg-[#501d59]
              dark:border dark:border-[#964fa3]/50
              text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5
              disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white/80" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-white/20 flex items-center justify-center p-0.5 shadow-sm">
                   <img 
                      src="/cmu-logo.png" 
                      alt="CMU Logo" 
                      className="w-full h-full object-contain drop-shadow-sm" 
                   />
                </div>
              )}
              <span className="text-lg">Sign in with CMU Account</span>
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 leading-tight px-4">
              By clicking &quot;Sign in&quot;, you agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-slate-300 dark:text-slate-600">
          © {new Date().getFullYear()} VisScan Security
        </p>
      </footer>
    </div>
  );
}
