/**
 * Canvas Elements Types
 * Defines types for SVG shapes, images, and text elements that can be added to the canvas
 */

export type CanvasElementType = "svg" | "image" | "text";

export interface CanvasElementBase {
    id: string;
    type: CanvasElementType;
    x: number; // Position in percentage (0-100)
    y: number; // Position in percentage (0-100)
    width: number; // Size in percentage
    height: number; // Size in percentage
    rotation: number; // Rotation in degrees
    opacity: number; // 0-100
    zIndex: number; // Stacking order
}

export interface SvgElement extends CanvasElementBase {
    type: "svg";
    category: string; // e.g., "shapes", "arrows", "decorative"
    svgId: string; // ID that maps to inline SVG component
    color?: string; // Fill color (optional)
}

export interface ImageElement extends CanvasElementBase {
    type: "image";
    category: string; // e.g., "stickers", "overlays", "blurred"
    imagePath: string; // Path to image file in public folder
}

export interface TextElement extends CanvasElementBase {
    type: "text";
    content: string;
    fontSize: number; // Base size (will be scaled)
    fontFamily: string;
    fontWeight: "normal" | "medium" | "bold";
    color: string;
}

export type CanvasElement = SvgElement | ImageElement | TextElement;

/**
 * SVG Category structure
 */
export interface SvgCategory {
    id: string;
    title: string;
    items: SvgItem[];
}

export interface SvgItem {
    id: string;
    name: string;
    icon: string; // Iconify icon for preview
}

/**
 * Image Category structure
 */
export interface ImageCategory {
    id: string;
    title: string;
    items: ImageItem[];
}

export interface ImageItem {
    id: string;
    name: string;
    imagePath: string; // Path to image file
    thumbnail?: string; // Optional thumbnail path
}
