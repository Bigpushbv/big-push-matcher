"use client";

import { useLabel } from "@/context/LabelContext";
import { useState, useRef, useEffect } from "react";

export default function LabelSwitcher() {
  const { labels, activeLabel, setActiveLabel } = useLabel();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeLabel) return null;

  const activeLabels = labels.filter((l) => l.status === "Actief");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{activeLabel.vlag}</span>
        <span>{activeLabel.naam}</span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {activeLabels.map((label) => (
            <button
              key={label.id}
              onClick={() => {
                setActiveLabel(label);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                label.id === activeLabel.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700"
              }`}
            >
              <span className="text-lg">{label.vlag}</span>
              <div className="text-left">
                <div>{label.naam}</div>
                <div className="text-xs text-gray-400">
                  Prefix: {label.prefix}
                </div>
              </div>
              {label.id === activeLabel.id && (
                <svg
                  className="ml-auto h-4 w-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
