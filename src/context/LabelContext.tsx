"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Label } from "@/types";

interface LabelContextType {
  labels: Label[];
  activeLabel: Label | null;
  setActiveLabel: (label: Label) => void;
  refreshLabels: () => Promise<void>;
  loading: boolean;
}

const LabelContext = createContext<LabelContextType>({
  labels: [],
  activeLabel: null,
  setActiveLabel: () => {},
  refreshLabels: async () => {},
  loading: true,
});

export function LabelProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [activeLabel, setActiveLabelState] = useState<Label | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshLabels = useCallback(async () => {
    try {
      const res = await fetch("/api/labels");
      const data = await res.json();
      setLabels(data);

      // Restore active label from localStorage or pick the first
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem("activeLabelId")
          : null;
      const saved = data.find((l: Label) => l.id === savedId);
      if (saved) {
        setActiveLabelState(saved);
      } else if (data.length > 0 && !activeLabel) {
        setActiveLabelState(data[0]);
      }
    } catch (err) {
      console.error("Failed to load labels:", err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshLabels();
  }, [refreshLabels]);

  const setActiveLabel = useCallback((label: Label) => {
    setActiveLabelState(label);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeLabelId", label.id);
    }
  }, []);

  return (
    <LabelContext.Provider
      value={{ labels, activeLabel, setActiveLabel, refreshLabels, loading }}
    >
      {children}
    </LabelContext.Provider>
  );
}

export function useLabel() {
  const context = useContext(LabelContext);
  if (!context) throw new Error("useLabel must be used within LabelProvider");
  return context;
}
