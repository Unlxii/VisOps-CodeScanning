"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-blue-100">
      {/* 1. Minimal Nav */}
      <nav className="w-full py-6 px-8 flex justify-end"></nav>

      {/* 2. Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 -mt-16">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Logo Box */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-blue-200">
              VS
            </div>
          </div>

          {/* Typography Section */}
          <div className="space-y-4">
            {/* ✅ หัวข้อ VisScan: ใช้ Gradient Text ไล่สีน้ำเงินเข้มไปฟ้า เพื่อให้ดูมีมิติ */}
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent pb-2">
              VisScan
            </h1>

            <p className="text-lg font-medium leading-relaxed">
              {/* ✅ ประโยคแรก: สีเทาเข้ม (Slate-700) เพื่อให้อ่านง่ายและตัดกับพื้นหลังขาว */}
              <span className="text-slate-700 block mb-1">
                Security scanning for modern dev teams.
              </span>

              {/* ✅ ประโยคเน้น: ใช้สีน้ำเงินสด (Blue-600) เพื่อดึงดูดสายตา */}
              <span className="text-blue-600 font-bold">
                Code, Build, and Ship securely.
              </span>
            </p>
          </div>

          {/* Minimal Actions */}
          <div className="pt-4 flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 duration-300"
            >
              {/* Google Icon */}
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span>Continue with Google</span>
            </Link>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-slate-300">
          © {new Date().getFullYear()} VisScan Security
        </p>
      </footer>
    </div>
  );
}
