"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FeatureItemProps {
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  icon: ReactNode;
  accentColor: string; // e.g. "blue", "purple", "emerald", "orange"
}

function FeatureItem({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt,
  imagePosition,
  icon,
  accentColor,
}: FeatureItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const colorMap: Record<string, { badge: string; glow: string; border: string }> = {
    blue: {
      badge: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
      glow: "from-blue-400/10 to-indigo-400/10",
      border: "border-blue-200/50 dark:border-blue-800/30",
    },
    purple: {
      badge: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50",
      glow: "from-purple-400/10 to-pink-400/10",
      border: "border-purple-200/50 dark:border-purple-800/30",
    },
    emerald: {
      badge: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
      glow: "from-emerald-400/10 to-teal-400/10",
      border: "border-emerald-200/50 dark:border-emerald-800/30",
    },
    orange: {
      badge: "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50",
      glow: "from-orange-400/10 to-amber-400/10",
      border: "border-orange-200/50 dark:border-orange-800/30",
    },
  };

  const colors = colorMap[accentColor] || colorMap.blue;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Text Content */}
      <div className={imagePosition === "left" ? "lg:order-2" : ""}>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${colors.badge}`}>
          {icon}
          {subtitle}
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
          {title}
        </h3>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Image */}
      <div className={`relative ${imagePosition === "left" ? "lg:order-1" : ""}`}>
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${colors.border} overflow-hidden shadow-xl dark:shadow-black/30`}>
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
        {/* Glow */}
        <div className={`absolute -inset-4 bg-gradient-to-br ${colors.glow} rounded-3xl blur-2xl -z-10`} />
      </div>
    </div>
  );
}

// --- Main Export ---

import { ScanSearch, Workflow, Bug, GitCompareArrows } from "lucide-react";

const features: Omit<FeatureItemProps, "imagePosition">[] = [
  {
    title: "Scan in Seconds",
    subtitle: "Quick Start",
    description:
      "Simply point to your Git repository and choose a scan mode. VisScan supports both Scan Only (SAST + secret detection) and full Scan & Build (build Docker image + container scanning) workflows.",
    imageSrc: "/landing/scan-page.png",
    imageAlt: "Start a Scan",
    icon: <ScanSearch size={14} />,
    accentColor: "purple",
  },
  {
    title: "Full Pipeline Visibility",
    subtitle: "CI/CD Pipeline",
    description:
      "Watch every step of your security pipeline unfold in real time: from source code checkout, through SAST analysis, Docker build, to container image scanning. Every stage is logged and traceable.",
    imageSrc: "/landing/scan-pipeline.png",
    imageAlt: "Pipeline View",
    icon: <Workflow size={14} />,
    accentColor: "emerald",
  },
  {
    title: "Vulnerability Deep Dive",
    subtitle: "Results & Analysis",
    description:
      "Drill into detailed vulnerability reports — grouped by severity (Critical, High, Medium, Low). Compare scans over time, track remediation progress, and export results for your team.",
    imageSrc: "/landing/scan-result.png",
    imageAlt: "Scan Results",
    icon: <Bug size={14} />,
    accentColor: "orange",
  },
  {
    title: "Compare & Track Progress",
    subtitle: "Comparison",
    description:
      "Compare vulnerability results across different scans side by side. Track your security improvements over time and ensure every release is safer than the last.",
    imageSrc: "/landing/compare-scan.png",
    imageAlt: "Compare Scans",
    icon: <GitCompareArrows size={14} />,
    accentColor: "blue",
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Ship Securely
            </span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            From code scanning to container image analysis — VisScan covers your entire security pipeline.
          </p>
        </div>

        {/* Feature Items */}
        <div className="space-y-24 md:space-y-32">
          {features.map((feature, index) => (
            <FeatureItem
              key={feature.title}
              {...feature}
              imagePosition={index % 2 === 0 ? "right" : "left"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
