"use client";

import { useState, useCallback, RefObject, useRef } from "react";
import { Output, Mp4OutputFormat, BufferTarget, CanvasSource } from "mediabunny";
import type { VideoCanvasHandle } from "@/types";
import type { ExportQuality, ExportSettings, ExportProgress } from "@/types";
import { QUALITY_SETTINGS, DEFAULT_EXPORT_FPS } from "@/lib/constants";
import { ensureVideoReady, waitForVideoFrame, downloadBlob } from "@/lib/video.utils";

// Re-export tipos para compatibilidad
export type { ExportQuality, ExportSettings, ExportProgress };

interface CancellationToken {
    cancelled: boolean;
}

export function useVideoExport(
    videoRef: RefObject<HTMLVideoElement | null>,
    canvasRef: RefObject<VideoCanvasHandle | null>,
) {
    const [exportProgress, setExportProgress] = useState<ExportProgress>({
        status: "idle",
        progress: 0,
        message: "",
    });
    
    const cancellationRef = useRef<CancellationToken>({ cancelled: false });
    const isExportingRef = useRef(false);

    const resetState = useCallback(() => {
        cancellationRef.current = { cancelled: false };
        isExportingRef.current = false;
        setExportProgress({
            status: "idle",
            progress: 0,
            message: "",
        });
    }, []);

    const exportVideo = useCallback(async (settings: ExportSettings): Promise<void> => {
        // Prevenir múltiples exportaciones simultáneas
        if (isExportingRef.current) {
            console.log("Export already in progress");
            return;
        }
        
        // Reset completo del estado antes de empezar
        cancellationRef.current = { cancelled: false };
        isExportingRef.current = true;
        
        const video = videoRef.current;
        const canvasHandle = canvasRef.current;

        if (!video || !canvasHandle) {
            setExportProgress({
                status: "error",
                progress: 0,
                message: "No hay video para exportar",
            });
            isExportingRef.current = false;
            return;
        }

        // Verificar que el video tenga duración válida
        if (!video.duration || video.duration === Infinity || isNaN(video.duration)) {
            setExportProgress({
                status: "error",
                progress: 0,
                message: "El video no está cargado correctamente",
            });
            isExportingRef.current = false;
            return;
        }

        const exportCanvas = canvasHandle.getExportCanvas();
        if (!exportCanvas) {
            setExportProgress({
                status: "error",
                progress: 0,
                message: "Error al obtener el canvas de exportación",
            });
            isExportingRef.current = false;
            return;
        }

        const qualitySettings = QUALITY_SETTINGS[settings.quality];
        const fps = settings.fps || qualitySettings.fps || DEFAULT_EXPORT_FPS;

        try {
            setExportProgress({
                status: "preparing",
                progress: 2,
                message: "Preparando video...",
            });

            // Asegurar que el video esté completamente listo
            await ensureVideoReady(video);
            
            if (cancellationRef.current.cancelled) {
                throw new Error("Exportación cancelada");
            }

            setExportProgress({
                status: "preparing",
                progress: 5,
                message: "Configurando exportación...",
            });

            // Ajustar tamaño del canvas según calidad manteniendo aspect ratio
            const originalWidth = exportCanvas.width;
            const originalHeight = exportCanvas.height;
            const originalAspectRatio = originalWidth / originalHeight;
            const qualityAspectRatio = qualitySettings.width / qualitySettings.height;
            
            // Escalar para mantener el aspect ratio del canvas original
            let targetWidth: number;
            let targetHeight: number;
            
            if (Math.abs(originalAspectRatio - qualityAspectRatio) < 0.01) {
                // Si los aspect ratios son similares, usar dimensiones directas
                targetWidth = qualitySettings.width;
                targetHeight = qualitySettings.height;
            } else if (originalAspectRatio > qualityAspectRatio) {
                // Canvas más ancho, escalar por ancho
                targetWidth = qualitySettings.width;
                targetHeight = Math.round(qualitySettings.width / originalAspectRatio);
            } else {
                // Canvas más alto, escalar por altura
                targetHeight = qualitySettings.height;
                targetWidth = Math.round(qualitySettings.height * originalAspectRatio);
            }
            
            // Ensure dimensions are even numbers (required by AVC codec)
            targetWidth = Math.round(targetWidth / 2) * 2;
            targetHeight = Math.round(targetHeight / 2) * 2;
            
            exportCanvas.width = targetWidth;
            exportCanvas.height = targetHeight;

            // Guardar posición actual del video
            const originalTime = video.currentTime;
            const wasPlaying = !video.paused;
            
            // Determine trim range (use full video if no trim specified)
            const trimStart = settings.trim?.start ?? 0;
            const trimEnd = settings.trim?.end ?? video.duration;
            const exportDuration = trimEnd - trimStart;

            await exportWithMediabunny(
                video, 
                canvasHandle, 
                exportCanvas, 
                exportDuration,
                trimStart,
                fps, 
                qualitySettings.bitrate, 
                qualitySettings.width,
                qualitySettings.height,
                setExportProgress,
                cancellationRef.current
            );

            // Restaurar canvas y video
            exportCanvas.width = originalWidth;
            exportCanvas.height = originalHeight;
            video.currentTime = originalTime;
            
            // Restaurar estado de reproducción
            if (wasPlaying) {
                await video.play().catch(() => {});
            }

        } catch (error) {
            // Si fue cancelado, no mostrar error
            if (cancellationRef.current.cancelled) {
                setExportProgress({
                    status: "idle",
                    progress: 0,
                    message: "",
                });
            } else {
                console.error("Error durante la exportación:", error);
                setExportProgress({
                    status: "error",
                    progress: 0,
                    message: error instanceof Error ? error.message : "Error durante la exportación",
                });
            }
        } finally {
            // Siempre resetear el flag de exportación
            isExportingRef.current = false;
        }
    }, [videoRef, canvasRef]);

    const cancelExport = useCallback(() => {
        // Marcar como cancelado
        cancellationRef.current.cancelled = true;
        // Resetear el flag de exportación inmediatamente
        isExportingRef.current = false;
        setExportProgress({
            status: "idle",
            progress: 0,
            message: "",
        });
    }, []);

    return {
        exportVideo,
        cancelExport,
        resetState,
        exportProgress,
    };
}

async function exportWithMediabunny(
    video: HTMLVideoElement,
    canvasHandle: VideoCanvasHandle,
    canvas: HTMLCanvasElement,
    duration: number,
    trimStart: number,
    fps: number,
    bitrate: number,
    width: number,
    height: number,
    setProgress: (p: ExportProgress) => void,
    cancellation: CancellationToken
): Promise<void> {
    // Verificar cancelación
    if (cancellation.cancelled) {
        throw new Error("Exportación cancelada");
    }
    
    setProgress({
        status: "encoding",
        progress: 10,
        message: `Iniciando codificación a ${fps} fps...`,
    });

    const totalFrames = Math.ceil(duration * fps);
    const frameDuration = 1 / fps;

    const output = new Output({
        format: new Mp4OutputFormat({
            fastStart: "in-memory",
        }),
        target: new BufferTarget(),
    });

    const videoSource = new CanvasSource(canvas, {
        codec: "avc",
        bitrate: bitrate,
    });

    output.addVideoTrack(videoSource, {
        frameRate: fps,
    });

    await output.start();

    // Pausar el video y moverlo al inicio del trim
    video.pause();
    video.currentTime = trimStart;
    await waitForVideoFrame(video);

    // Procesar frames con verificación de cancelación
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // Verificar cancelación antes de cada frame
        if (cancellation.cancelled) {
            throw new Error("Exportación cancelada");
        }
        
        const outputTime = frameIndex / fps; // Time in the output video
        const sourceTime = trimStart + outputTime; // Time in the source video
        
        video.currentTime = Math.min(sourceTime, trimStart + duration - 0.001);
        
        await waitForVideoFrame(video);

        await canvasHandle.drawFrame();

        await videoSource.add(outputTime, frameDuration);

        // Actualizar progreso cada 5 frames para mejor rendimiento
        if (frameIndex % 5 === 0 || frameIndex === totalFrames - 1) {
            const progress = 10 + Math.round((frameIndex / totalFrames) * 80);
            setProgress({
                status: "encoding",
                progress,
                message: `Codificando ${frameIndex + 1}/${totalFrames} frames (${fps}fps)...`,
            });
        }
    }

    // Verificar cancelación antes de finalizar
    if (cancellation.cancelled) {
        throw new Error("Exportación cancelada");
    }

    setProgress({
        status: "finalizing",
        progress: 92,
        message: "Finalizando codificación...",
    });

    await output.finalize();

    // Verificar una última vez antes de descargar
    if (cancellation.cancelled) {
        throw new Error("Exportación cancelada");
    }

    setProgress({
        status: "finalizing",
        progress: 96,
        message: "Generando archivo MP4...",
    });

    const buffer = (output.target as BufferTarget).buffer;
    
    if (!buffer) {
        throw new Error("No se pudo generar el archivo MP4");
    }

    const blob = new Blob([buffer], { type: "video/mp4" });
    downloadBlob(blob, `video-export-${width}x${height}.mp4`);

    setProgress({
        status: "complete",
        progress: 100,
        message: "¡Exportación completada!",
    });
}
