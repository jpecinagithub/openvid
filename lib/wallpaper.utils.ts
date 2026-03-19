import { getWallpaperByIndex } from './wallpaper.catalog';

/**
 * Obtiene la URL del wallpaper JPG para renderizado en canvas
 * @param index - Índice global del wallpaper (-1 para ninguno)
 */
export function getWallpaperUrl(index: number): string {
    if (index < 0) return "";
    return getWallpaperByIndex(index)?.fullUrl ?? "";
}

/**
 * Obtiene la URL AVIF/WEBP de previsualización del wallpaper
 * @param index - Índice global del wallpaper
 */
export function getWallpaperPreviewUrl(index: number): string {
    if (index < 0) return "";
    return getWallpaperByIndex(index)?.previewUrl ?? "";
}
