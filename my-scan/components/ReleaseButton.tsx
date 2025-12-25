"use client";
import React, { useState } from "react";

export default function ReleaseButton({ scanId }: { scanId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function onRelease() {
    if (!confirm("Are you sure you want to push this image to Docker Hub?")) return;

    setLoading(true);
    try {
      // เรายังใช้ API เดิมได้ (หรือจะเปลี่ยนชื่อ API ก็ได้ แต่ Logic ข้างในคือการกด Play Manual Job)
      const res = await fetch(`/api/scan/confirm-push/${scanId}`, {
        method: "POST",
      });
      const j = await res.json();
      
      if (res.ok) {
        setMessage("Release triggered! Image is being pushed to Docker Hub.");
        setIsDone(true);
      } else {
        setMessage(`Error: ${JSON.stringify(j)}`);
      }
    } catch (e) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (isDone) {
    return (
        <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded text-sm">
            {message}
        </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Actions</h3>
      <button
        onClick={onRelease}
        disabled={loading}
        className={`flex items-center px-4 py-2 rounded text-white font-medium transition-colors
          ${loading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {loading ? (
           <>
             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             Pushing to Docker Hub...
           </>
        ) : (
           "Push to Docker Hub"
        )}
      </button>
      
      {message && !isDone && (
        <div className="mt-2 text-sm text-red-600">{message}</div>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        * This will trigger the final stage to upload the verified image.
      </p>
    </div>
  );
}