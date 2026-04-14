export type CameraShape = "circle" | "rounded" | "square";

export type CameraCorner =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "custom";

export interface CameraPosition {
    x: number;
    y: number;
}

export interface CameraConfig {
    enabled: boolean;
    deviceId: string | null;
    shape: CameraShape;
    size: number;
    position: CameraPosition;
    corner: CameraCorner;
    mirror: boolean;
}

export interface MicrophoneConfig {
    enabled: boolean;
    deviceId: string | null;
    volume: number;
    noiseSuppression: boolean;
    echoCancellation: boolean;
}

export interface RecordingSetupConfig {
    camera: CameraConfig;
    microphone: MicrophoneConfig;
    systemAudio: boolean;
}

export interface MediaDeviceOption {
    deviceId: string;
    label: string;
    groupId: string;
}

export interface AvailableDevices {
    cameras: MediaDeviceOption[];
    microphones: MediaDeviceOption[];
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
    enabled: false,
    deviceId: null,
    shape: "circle",
    size: 0.18,
    position: { x: 0.95, y: 0.95 },
    corner: "bottom-right",
    mirror: true,
};

export const DEFAULT_MICROPHONE_CONFIG: MicrophoneConfig = {
    enabled: false,
    deviceId: null,
    volume: 1,
    noiseSuppression: true,
    echoCancellation: true,
};

export const DEFAULT_RECORDING_SETUP: RecordingSetupConfig = {
    camera: DEFAULT_CAMERA_CONFIG,
    microphone: DEFAULT_MICROPHONE_CONFIG,
    systemAudio: true,
};

export const CORNER_POSITIONS: Record<
    Exclude<CameraCorner, "custom">,
    CameraPosition
> = {
    "top-left": { x: 0.05, y: 0.05 },
    "top-right": { x: 0.95, y: 0.05 },
    "bottom-left": { x: 0.05, y: 0.95 },
    "bottom-right": { x: 0.95, y: 0.95 },
};

export const CAMERA_SHAPES: Array<{ id: CameraShape; label: string; icon: string }> = [
    { id: "circle", label: "Círculo", icon: "solar:record-circle-bold" },
    { id: "rounded", label: "Redondeado", icon: "solar:squircle-bold" },
    { id: "square", label: "Cuadrado", icon: "solar:stop-bold" },
];

export async function enumerateMediaDevices(): Promise<AvailableDevices> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        return { cameras: [], microphones: [] };
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
            cameras: devices
                .filter((d) => d.kind === "videoinput")
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || "Cámara sin nombre",
                    groupId: d.groupId,
                })),
            microphones: devices
                .filter((d) => d.kind === "audioinput")
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || "Micrófono sin nombre",
                    groupId: d.groupId,
                })),
        };
    } catch (err) {
        console.warn("Error al enumerar dispositivos:", err);
        return { cameras: [], microphones: [] };
    }
}

export async function requestCameraStream(
    deviceId: string | null
): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
        },
        audio: false,
    });
}

export async function requestMicrophoneStream(
    deviceId: string | null,
    options: { noiseSuppression: boolean; echoCancellation: boolean }
): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            noiseSuppression: options.noiseSuppression,
            echoCancellation: options.echoCancellation,
        },
    });
}
