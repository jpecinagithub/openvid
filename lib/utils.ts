import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a hex color to rgba with the specified opacity
 * @param hex - The hex color (e.g., "#ffffff" or "#fff")
 * @param opacity - The opacity value from 0-100 (default: 100)
 * @returns The rgba color string (e.g., "rgba(255, 255, 255, 1)")
 */
export function hexToRgba(hex: string, opacity: number = 100): string {
  // Remove # if present
  hex = hex.replace("#", "");
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("");
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Convert opacity from 0-100 to 0-1
  const alpha = opacity / 100;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
