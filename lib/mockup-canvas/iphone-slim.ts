/**
 * Renderizado del mockup de iPhone Slim en Canvas
 */

import { hexToRgba } from "@/lib/utils";
import {
    drawWifiIcon,
    drawSignalBars,
    drawBattery,
} from "@/lib/canvas-icons";
import type { MockupCanvasContext, MockupDrawResult } from "./types";
import { drawRoundedRectPath, drawMockupShadow } from "./shared";

/**
 * Dibuja el mockup de iPhone Slim en canvas
 */
export function drawIPhoneSlimMockup(context: MockupCanvasContext): MockupDrawResult {
    const { ctx, x, y, width, height, config, cornerRadius, shadowBlur } = context;
    const isDark = config.darkMode;
    const frameColor = config.frameColor;
    const headerOpacity = config.headerOpacity ?? 100;

    // Escalado proporcional
    const headerScale = (config.headerScale || 100) / 100;

    // Valores base escalados
    const framePadding = 6 * headerScale;
    const statusBarHeight = 28 * headerScale;
    const dynamicIslandHeight = 18 * headerScale;
    const dynamicIslandTop = 6 * headerScale;
    const homeIndicatorHeight = 3 * headerScale;
    const homeIndicatorBottom = 6 * headerScale;

    // Colores
    const borderColor = isDark ? "#404040" : "#525252";
    const statusBarText = isDark ? "#ffffff" : "#000000";

    // 0. Dibujar sombra exterior del mockup (sin bloquear el fondo)
    const outerRadius = cornerRadius * 2.5;
    drawMockupShadow(ctx, x, y, width, height, outerRadius, shadowBlur);

    // 1. Dibujar marco exterior del dispositivo
    ctx.save();
    drawRoundedRectPath(ctx, x, y, width, height, outerRadius);
    ctx.fillStyle = hexToRgba(frameColor, headerOpacity);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 2. Dibujar pantalla interior
    const screenX = x + framePadding;
    const screenY = y + framePadding;
    const screenWidth = width - framePadding * 2;
    const screenHeight = height - framePadding * 2;
    const innerRadius = cornerRadius * 2.2;

    ctx.save();
    drawRoundedRectPath(ctx, screenX, screenY, screenWidth, screenHeight, innerRadius);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 3. Dibujar Dynamic Island
    const dynamicIslandWidth = screenWidth * 0.28;
    const dynamicIslandX = screenX + (screenWidth - dynamicIslandWidth) / 2;
    const dynamicIslandY = screenY + dynamicIslandTop;

    ctx.save();
    drawRoundedRectPath(ctx, dynamicIslandX, dynamicIslandY, dynamicIslandWidth, dynamicIslandHeight, dynamicIslandHeight / 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.restore();

    // 4. Dibujar Status Bar
    const timeFontSize = 10 * headerScale;
    const timeX = screenX + 24 * headerScale;
    const timeY = screenY + statusBarHeight / 2 + 2;

    ctx.save();
    ctx.font = `bold ${timeFontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = statusBarText;
    ctx.textBaseline = "middle";
    ctx.fillText("9:41", timeX, timeY);
    ctx.restore();

    // Indicadores de señal, wifi, batería (derecha) con iconos reales
    const indicatorsY = timeY - 5 * headerScale;
    const iconStatusSize = 12 * headerScale;
    const batteryWidth = 20 * headerScale;
    const batteryHeight = 10 * headerScale;

    // Batería (derecha)
    const batteryX = screenX + screenWidth - 24 * headerScale - batteryWidth;
    const batteryY = timeY - batteryHeight / 2;
    drawBattery(ctx, batteryX, batteryY, batteryWidth, batteryHeight, statusBarText, 0.9);

    // WiFi (centro-derecha)
    const wifiX = batteryX - iconStatusSize - 6 * headerScale;
    const wifiY = indicatorsY;
    drawWifiIcon(ctx, wifiX, wifiY, iconStatusSize, statusBarText);

    // Barras de señal (izquierda del wifi)
    const signalX = wifiX - iconStatusSize - 4 * headerScale;
    const signalY = indicatorsY;
    drawSignalBars(ctx, signalX, signalY, iconStatusSize, statusBarText);

    // 5. Dibujar Home Indicator
    const homeIndicatorWidth = screenWidth * 0.35;
    const homeIndicatorX = screenX + (screenWidth - homeIndicatorWidth) / 2;
    const homeIndicatorY = screenY + screenHeight - homeIndicatorBottom - homeIndicatorHeight;

    ctx.save();
    drawRoundedRectPath(ctx, homeIndicatorX, homeIndicatorY, homeIndicatorWidth, homeIndicatorHeight, homeIndicatorHeight / 2);
    ctx.fillStyle = `${statusBarText}15`;
    ctx.fill();
    ctx.restore();

    return {
        contentX: screenX,
        contentY: screenY + statusBarHeight,
        contentWidth: screenWidth,
        contentHeight: screenHeight - statusBarHeight - homeIndicatorBottom - homeIndicatorHeight,
    };
}
