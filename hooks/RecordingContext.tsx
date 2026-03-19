"use client";

import { createContext, useContext, ReactNode } from "react";
import { useScreenRecording } from "./useScreenRecording";
import type { RecordingState, RecordingContextType } from "@/types";

// Re-export tipos para compatibilidad
export type { RecordingState, RecordingContextType };

const RecordingContext = createContext<RecordingContextType | null>(null);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const recording = useScreenRecording();
  
  return (
    <RecordingContext.Provider value={recording}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
}
