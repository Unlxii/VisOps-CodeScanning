"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

const STACKS = ["node", "python", "java", "go"];

export default function AdminTemplates() {
  const [selectedStack, setSelectedStack] = useState("node");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลเมื่อเลือก Stack เปลี่ยน
  useEffect(() => {
    fetch(`/api/templates?stack=${selectedStack}`)
      .then((res) => res.text())
      .then((txt) => setContent(txt));
  }, [selectedStack]);

  // บันทึกข้อมูล
  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack: selectedStack, content }),
      });
      alert(" Saved successfully!");
    } catch (e) {
      alert(" Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Dockerfile Templates Admin</h1>
      
      <div className="mb-4">
        <label className="font-semibold mr-4">Select Stack:</label>
        <select 
          className="border p-2 rounded"
          value={selectedStack}
          onChange={(e) => setSelectedStack(e.target.value)}
        >
          {STACKS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      <textarea
        className="w-full h-96 p-4 border rounded font-mono text-sm bg-slate-900 text-green-400"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
        Save Template
      </button>
    </div>
  );
}