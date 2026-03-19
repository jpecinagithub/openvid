export type RecordingState = "idle" | "countdown" | "recording" | "processing";

export interface RecordingResult {
    blob: Blob;
    url: string;
    duration: number;
}

export interface RecordingContextType {
    state: RecordingState;
    countdown: number;
    recordingTime: number;
    error: string | null;
    startCountdown: () => Promise<void>;
    stopRecording: () => void;
    cancelRecording: () => void;
    isIdle: boolean;
    isCountdown: boolean;
    isRecording: boolean;
    isProcessing: boolean;
}
