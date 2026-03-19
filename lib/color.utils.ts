// Parse a hex color into [r, g, b] (handles #rgb and #rrggbb)
export function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
        return [
            parseInt(clean[0] + clean[0], 16),
            parseInt(clean[1] + clean[1], 16),
            parseInt(clean[2] + clean[2], 16),
        ];
    }
    return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
    ];
}

// Perceived luminance (0 = black, 1 = white)
export function luminance(r: number, g: number, b: number): number {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Shift a hex color lighter or darker by a fixed amount per channel
export function shiftColor(hex: string, amount: number): string {
    const [r, g, b] = hexToRgb(hex);
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
    return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`;
}

// Derive a search-bar background that harmonizes with frameColor:
// - for dark frames  → slightly lighter than frame
// - for light frames → slightly darker than frame
export function deriveSearchBg(frameColor: string): string {
    try {
        const [r, g, b] = hexToRgb(frameColor);
        const lum = luminance(r, g, b);
        // Dark frame → lighten a bit; light frame → darken a bit
        return lum < 0.5
            ? shiftColor(frameColor, +28)
            : shiftColor(frameColor, -22);
    } catch {
        return "#2b2b2b";
    }
}