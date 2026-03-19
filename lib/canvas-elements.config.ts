/**
 * Canvas Elements Configuration
 * Defines available SVG shapes, images, and their categories
 */

import type { SvgCategory, ImageCategory } from "@/types/canvas-elements.types";

// Elementos SVG destacados que se muestran directamente (11 slots)
export const PINNED_SVG_ITEMS = [
    { id: "rectangle", name: "Rectángulo", icon: "ph:rectangle-bold" },
    { id: "circle", name: "Círculo", icon: "ph:circle-bold" },
    { id: "triangle", name: "Triángulo", icon: "ph:triangle-bold" },
    { id: "arrow-right", name: "Derecha", icon: "ph:arrow-right-bold" },
    { id: "star", name: "Estrella", icon: "ph:star-bold" },
    { id: "heart", name: "Corazón", icon: "ph:heart-bold" },
    { id: "hexagon", name: "Hexágono", icon: "ph:hexagon-bold" },
    { id: "lightning", name: "Rayo", icon: "ph:lightning-bold" },
    { id: "arrow-left", name: "Izquierda", icon: "ph:arrow-left-bold" },
    { id: "diamond", name: "Rombo", icon: "ph:diamond-bold" },
    { id: "chat", name: "Bocadillo", icon: "ph:chat-circle-bold" },
];

// Elementos de imagen destacados que se muestran directamente (11 slots)
export const PINNED_IMAGE_ITEMS = [
    { id: "lighta-curve", name: "Lighta curve", imagePath: "/elements/images/blurred/lighta-curve.webp" },
    // Add more pinned images here (up to 11 total)
];

export const SVG_CATEGORIES: SvgCategory[] = [
    {
        id: "shapes",
        title: "Básicas",
        items: [
            { id: "rectangle", name: "Rectángulo", icon: "ph:rectangle-bold" },
            { id: "circle", name: "Círculo", icon: "ph:circle-bold" },
            { id: "triangle", name: "Triángulo", icon: "ph:triangle-bold" },
            { id: "hexagon", name: "Hexágono", icon: "ph:hexagon-bold" },
            { id: "diamond", name: "Rombo", icon: "ph:diamond-bold" },
            { id: "square", name: "Cuadrado", icon: "ph:square-bold" },
        ]
    },
    {
        id: "arrows",
        title: "Flechas",
        items: [
            { id: "arrow-right", name: "Derecha", icon: "ph:arrow-right-bold" },
            { id: "arrow-left", name: "Izquierda", icon: "ph:arrow-left-bold" },
            { id: "arrow-double", name: "Doble", icon: "ph:arrows-left-right-bold" },
            { id: "arrow-curve", name: "Curva", icon: "ph:arrow-u-up-left-bold" },
            { id: "arrow-diagonal", name: "Diagonal", icon: "ph:arrow-up-right-bold" },
            { id: "arrow-bend", name: "Ángulo", icon: "ph:arrow-bend-up-right-bold" },
        ]
    },
    {
        id: "decorative",
        title: "Decorativas",
        items: [
            { id: "star", name: "Estrella", icon: "ph:star-bold" },
            { id: "heart", name: "Corazón", icon: "ph:heart-bold" },
            { id: "lightning", name: "Rayo", icon: "ph:lightning-bold" },
            { id: "chat", name: "Bocadillo", icon: "ph:chat-circle-bold" },
            { id: "seal", name: "Sello", icon: "ph:seal-bold" },
            { id: "drop", name: "Gota", icon: "ph:drop-bold" },
        ]
    }
];

export const IMAGE_CATEGORIES: ImageCategory[] = [
    {
        id: "stickers",
        title: "Stickers",
        items: [
            // Add your sticker items here
            // { id: "sticker1", name: "Emoji Fire", imagePath: "/elements/images/stickers/fire.png", thumbnail: "/elements/images/stickers/fire-thumb.png" },
        ]
    },
    {
        id: "overlays",
        title: "Overlays",
        items: [
            // Add your overlay items here
            // { id: "overlay1", name: "Light Leak", imagePath: "/elements/images/overlays/light-leak.png" },
        ]
    },
    {
        id: "blurred",
        title: "Desenfoques",
        items: [
           { id: "lighta-curve", name: "Lighta curve", imagePath: "/elements/images/blurred/lighta-curve.webp" },
        ]
    }
];
