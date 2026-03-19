/**
 * Renderizado del mockup de Browser Tab Glass en Canvas
 */

import type { MockupCanvasContext, MockupDrawResult } from "./types";
import { drawRoundedRectPath, drawMockupShadow } from "./shared";

export function drawBrowserTabGlassMockup(context: MockupCanvasContext): MockupDrawResult {
    const { ctx, x, y, width, height, config, cornerRadius, shadowBlur } = context;
    const isDark = config.darkMode;
    const url = config.url || "Nueva pestaña";

    const headerScale = (config.headerScale || 100) / 100;

    const glassPadding      = 7;
    const glassCornerRadius = cornerRadius;
    const innerCornerRadius = Math.max(0, glassCornerRadius + 4);

    // Tab bar dimensions — igual que el React
    const tabBarH      = 32  * headerScale;  // increased for top padding
    const dotSize      = 10  * headerScale;
    const dotGap       = 6   * headerScale;
    const dotPaddingX  = 4   * headerScale;
    const tabH         = 28  * headerScale;
    const tabW         = 184 * headerScale;
    const tabPaddingX  = 12  * headerScale;
    const tabIconSize  = 12  * headerScale;
    const tabFontSize  = 10  * headerScale;
    const addBtnSize   = 24  * headerScale;
    const leftPadding  = 16  * headerScale;
    const dotsTabGap   = 12  * headerScale;
    const tabAddGap    = 12  * headerScale;
    const winIconGap   = 24  * headerScale;
    const winIconMB    = 10  * headerScale;
    const winIconMR    = 4   * headerScale;

    const bgColor = isDark ? "#262626" : "#f9f9f9";

    // Dark/light tab styles — igual que el React
    const tabBg          = isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)";
    const tabBorderColor = isDark ? "rgba(255,255,255,0.2)"  : "rgba(255,255,255,0.9)";
    const tabTitleColor  = isDark ? "#d1d5db"                : "#374151";
    const tabCloseColor  = isDark ? "rgba(209,213,219,0.6)"  : "rgba(75,85,99,0.8)";
    const tabCloseBg     = isDark ? "rgba(255,255,255,0.1)"  : "rgba(156,163,175,0.2)";

    // 0. Sombra exterior
    drawMockupShadow(ctx, x, y, width, height, glassCornerRadius, shadowBlur);

    // 1. Área interior
    const innerX      = x + glassPadding;
    const innerY      = y + glassPadding;
    const innerWidth  = width  - glassPadding * 2;
    const innerHeight = height - glassPadding * 2;

    // 2. Cáscara glass
    ctx.save();
    drawRoundedRectPath(ctx, x, y, width, height, glassCornerRadius);
    const grad = ctx.createLinearGradient(x, y + height, x + width, y);
    grad.addColorStop(0, "rgba(255,255,255,0.3)");
    grad.addColorStop(1, "rgba(255,255,255,0.4)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(x + glassCornerRadius, y + 0.375);
    ctx.lineTo(x + width - glassCornerRadius, y + 0.375);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 0.375, y + glassCornerRadius);
    ctx.lineTo(x + 0.375, y + height - glassCornerRadius);
    ctx.stroke();
    ctx.restore();

    // 3. Clip al área interior
    ctx.save();
    drawRoundedRectPath(ctx, innerX, innerY, innerWidth, innerHeight, innerCornerRadius);
    ctx.clip();

    // 4. Fondo contenido (debajo del tab bar)
    ctx.fillStyle = bgColor;
    ctx.fillRect(innerX, innerY + tabBarH, innerWidth, innerHeight - tabBarH);

    // ── TAB BAR ──
    // El tab bar no tiene fondo propio (transparente sobre el glass)

    // 5. Window dots (bottom-aligned, left side)
    const dotBaseY  = innerY + (tabBarH - dotSize) / 2;
    const dotStartX = innerX + leftPadding + dotPaddingX;
    [0, 1, 2].forEach((i) => {
        const dotX = dotStartX + i * (dotSize + dotGap) + dotSize / 2;
        const dotY = dotBaseY + dotSize / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    });

    // 6. Active tab (bottom-aligned, after dots)
    const dotsBlockW = dotPaddingX + 3 * dotSize + 2 * dotGap;
    const tabX = innerX + leftPadding + dotsBlockW + dotsTabGap;
    const tabY = innerY + tabBarH - tabH + 2 * headerScale;

    ctx.save();
    // Tab background with top+left+right border
    drawRoundedRectPath(ctx, tabX, tabY, tabW, tabH, 8 * headerScale);
    ctx.fillStyle = tabBg;
    ctx.fill();
    // Top border
    ctx.strokeStyle = tabBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tabX + 8 * headerScale, tabY);
    ctx.lineTo(tabX + tabW - 8 * headerScale, tabY);
    ctx.stroke();
    // Left border
    ctx.beginPath();
    ctx.moveTo(tabX, tabY + 8 * headerScale);
    ctx.lineTo(tabX, tabY + tabH);
    ctx.stroke();
    // Right border
    ctx.beginPath();
    ctx.moveTo(tabX + tabW, tabY + 8 * headerScale);
    ctx.lineTo(tabX + tabW, tabY + tabH);
    ctx.stroke();
    ctx.restore();

    // Favicon dot (blue circle)
    const faviconX = tabX + tabPaddingX + tabIconSize / 2;
    const faviconY = tabY + tabH / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(faviconX, faviconY, tabIconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#60a5fa";
    ctx.fill();
    ctx.restore();

    // Tab title
    ctx.save();
    ctx.font = `500 ${tabFontSize}px "Inter", -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = tabTitleColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const maxTitleW = tabW - tabPaddingX * 2 - tabIconSize - 8 * headerScale - 8 * headerScale - 8 * headerScale;
    const titleText = url.replace(/^https?:\/\//, "").substring(0, 30);
    ctx.save();
    ctx.beginPath();
    ctx.rect(faviconX + tabIconSize / 2 + 8 * headerScale, tabY, maxTitleW, tabH);
    ctx.clip();
    ctx.fillText(titleText, faviconX + tabIconSize / 2 + 8 * headerScale, faviconY);
    ctx.restore();
    ctx.restore();

    // Close X button
    const closeSize = 8 * headerScale;
    const closeX    = tabX + tabW - tabPaddingX - closeSize;
    const closeY    = tabY + (tabH - closeSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(closeX + closeSize / 2, closeY + closeSize / 2, closeSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tabCloseBg;
    ctx.fill();
    // X lines
    ctx.strokeStyle = tabCloseColor;
    ctx.lineWidth = 1 * headerScale;
    ctx.beginPath();
    ctx.moveTo(closeX + 1, closeY + 1);
    ctx.lineTo(closeX + closeSize - 1, closeY + closeSize - 1);
    ctx.moveTo(closeX + closeSize - 1, closeY + 1);
    ctx.lineTo(closeX + 1, closeY + closeSize - 1);
    ctx.stroke();
    ctx.restore();

    // 7. Add tab button (+)
    const addBtnX = tabX + tabW + tabAddGap;
    const addBtnY = innerY + (tabBarH - addBtnSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(addBtnX + addBtnSize / 2, addBtnY + addBtnSize / 2, addBtnSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // + symbol
    const plusS = 10 * headerScale;
    const plusCX = addBtnX + addBtnSize / 2;
    const plusCY = addBtnY + addBtnSize / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5 * headerScale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(plusCX - plusS / 2, plusCY);
    ctx.lineTo(plusCX + plusS / 2, plusCY);
    ctx.moveTo(plusCX, plusCY - plusS / 2);
    ctx.lineTo(plusCX, plusCY + plusS / 2);
    ctx.stroke();
    ctx.restore();

    // 8. Windows-style buttons (right side, bottom-aligned)
    const winBaseY = innerY + tabBarH / 2;
    const winRightX = innerX + innerWidth - winIconMR;

    // Close X
    const wCloseSize = 12 * headerScale;
    drawWinX(ctx, winRightX - wCloseSize, winBaseY - wCloseSize / 2, wCloseSize, "rgba(255,255,255,0.5)", headerScale);

    // Maximize (border box)
    const wMaxSize = 9 * headerScale;
    const wMaxX = winRightX - wCloseSize - winIconGap - wMaxSize;
    const wMaxY = winBaseY - wMaxSize / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2 * headerScale;
    ctx.strokeRect(wMaxX, wMaxY, wMaxSize, wMaxSize);
    ctx.restore();

    // Minimize (line)
    const wMinW = 12 * headerScale;
    const wMinX = wMaxX - winIconGap - wMinW;
    const wMinY = winBaseY - 0.6 * headerScale;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(wMinX, wMinY, wMinW, 1.2 * headerScale);
    ctx.restore();

    // Fin clip interior
    ctx.restore();

    return {
        contentX:      innerX,
        contentY:      innerY + tabBarH,
        contentWidth:  innerWidth,
        contentHeight: innerHeight - tabBarH,
    };
}

function drawWinX(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, scale: number) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.restore();
}