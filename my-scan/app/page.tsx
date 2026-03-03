"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureSection from "@/components/landing/FeatureSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

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
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <LandingNavbar onSignIn={handleCMULogin} isLoading={isLoading} />
      <HeroSection onSignIn={handleCMULogin} isLoading={isLoading} />
      <FeatureSection />
      <ShowcaseSection />
      <CTASection onSignIn={handleCMULogin} isLoading={isLoading} />
      <LandingFooter />
    </div>
  );
}