"use client";

import { useEffect, useRef, useState } from "react";

interface FeatureItemProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  accentColor: string;
  tags?: { label: string; color: string }[];
}

function FeatureItem({
  title,
  description,
  imageSrc,
  imageAlt,
  imagePosition,
  accentColor,
  tags,
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

  const colorMap: Record<string, { glow: string; border: string }> = {
    blue: {
      glow: "from-blue-400/10 to-indigo-400/10",
      border: "border-blue-200/50 dark:border-blue-800/30",
    },
    purple: {
      glow: "from-purple-400/10 to-pink-400/10",
      border: "border-purple-200/50 dark:border-purple-800/30",
    },
    emerald: {
      glow: "from-emerald-400/10 to-teal-400/10",
      border: "border-emerald-200/50 dark:border-emerald-800/30",
    },
    orange: {
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
        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
          {title}
        </h3>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
          {description}
        </p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${tag.color}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
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

const features: Omit<FeatureItemProps, "imagePosition">[] = [
  {
    title: "Scan in Seconds",
    description:
      "Simply point to your Git repository and choose a scan mode. VisScan supports both Scan Only (SAST + secret detection) and full Scan & Build (build Docker image + container scanning) workflows.",
    imageSrc: "/landing/scan-page.png",
    imageAlt: "Start a Scan",
    accentColor: "purple",
  },
  {
    title: "Full Pipeline Visibility",
    description:
      "Watch every step of your security pipeline unfold in real time: from source code checkout, through SAST analysis, Docker build, to container image scanning. Every stage is logged and traceable.",
    imageSrc: "/landing/scan-pipeline.png",
    imageAlt: "Pipeline View",
    accentColor: "emerald",
  },
  {
    title: "Vulnerability Deep Dive",
    description:
      "Drill into detailed vulnerability reports — grouped by severity (Critical, High, Medium, Low). Powered by three industry-standard scanners working together to give you full coverage.",
    imageSrc: "/landing/scan-result.png",
    imageAlt: "Scan Results",
    accentColor: "orange",
    tags: [
      { label: "Gitleaks · Secrets Detection", color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50" },
      { label: "Semgrep · SAST", color: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50" },
      { label: "Trivy · Container Scan", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" },
    ],
  },
  {
    title: "Compare & Track Progress",
    description:
      "Compare vulnerability results across different scans side by side. Track your security improvements over time and ensure every release is safer than the last.",
    imageSrc: "/landing/compare-scan.png",
    imageAlt: "Compare Scans",
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
