"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useMemo, useState, useCallback } from "react";
import type { VideoCanvasHandle, VideoCanvasProps, VideoThumbnail } from "@/types";
import type { ImageElement, SvgElement, CanvasElement } from "@/types/canvas-elements.types";
import { ASPECT_RATIO_DIMENSIONS } from "@/types";
import { interpolateCursorPosition, DEFAULT_CURSOR_CONFIG, EMPTY_CURSOR_DATA } from "@/types/cursor.types";
import type { CursorKeyframe } from "@/types/cursor.types";
import { getWallpaperUrl } from "@/lib/wallpaper.utils";
import { drawRoundedRect, drawRoundedRectBottomOnly, calculateScaledPadding, applyCanvasBackground, getAspectRatioStyle, getMaxWidth } from "@/lib/canvas.utils";
import { drawMockupToCanvas } from "@/lib/mockup-canvas.utils";
import { zoomLevelToFactor, speedToTransitionMs, ZOOM_EASING } from "@/types/zoom.types";
import type { ZoomFragment } from "@/types/zoom.types";
import PlaceholderEditor from "../PlaceholderEditor";
import { MockupWrapper } from "./mockups/MockupWrapper";
import { DEFAULT_MOCKUP_CONFIG } from "@/types/mockup.types";
import { calculateSmoothZoom } from "@/lib/canvas.utils";
import { SVG_COMPONENTS, getSvgDataUrl } from "@/components/canvas-svg";
import { getCursorSvgDataUrl } from "@/components/cursor-svg";
import { VIDEO_Z_INDEX, BOTTOM_ONLY_RADIUS_MOCKUPS, SELF_SHADOWING_MOCKUPS } from "@/lib/constants";
export type { VideoCanvasHandle, VideoCanvasProps };

type Corner = "top-left" | "top-right" | "bottom-right" | "bottom-left";

function getNearestCorner(e: React.MouseEvent<HTMLElement>, rotationDeg = 0): Corner {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const rad = (-rotationDeg * Math.PI) / 180;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

    const isRight = localX > 0;
    const isBottom = localY > 0;
    if (!isRight && !isBottom) return "top-left";
    if (isRight && !isBottom) return "top-right";
    if (isRight && isBottom) return "bottom-right";
    return "bottom-left";
}

function getCornerStyle(corner: Corner, offset = -10): React.CSSProperties {
    const base: React.CSSProperties = { position: "absolute", zIndex: 20 };
    switch (corner) {
        case "top-left":
            return { ...base, top: offset, left: offset, cursor: "nw-resize" };
        case "top-right":
            return { ...base, top: offset, right: offset, cursor: "ne-resize" };
        case "bottom-right":
            return { ...base, bottom: offset, right: offset, cursor: "se-resize" };
        case "bottom-left":
            return { ...base, bottom: offset, left: offset, cursor: "sw-resize" };
    }
}

const CORNER_ICON_ROTATION: Record<Corner, number> = {
    "top-right": 0,    // posición natural del SVG
    "bottom-right": 90,   // gira 90° a la derecha
    "bottom-left": 180,  // gira 180°
    "top-left": 270,  // gira 270°
};

function RotationHandleIcon({ corner, color = "#3b82f6" }: { corner: Corner; color?: string }) {
    const rot = CORNER_ICON_ROTATION[corner];
    const maskId = `rotation-mask-${corner}`;

    return (
        <div style={{ display: "flex", transform: `rotate(${rot}deg)` }}>
            <svg width="18" height="18" viewBox="0 0 685 670" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={maskId} maskUnits="userSpaceOnUse" x="-17.9957" y="-16.9657" width="719.848" height="701.972" fill="black">
                    <rect fill="white" x="-17.9957" y="-16.9657" width="719.848" height="701.972" />
                    <path d="M188.7 17.3203C192.371 20.6905 195.297 24.7568 196.896 29.5153C196.804 31.4331 196.628 33.3462 196.407 35.253L196.086 38.3485C194.185 45.1048 187.596 49.2812 182.3 53.4645L179.893 55.3804C170.681 62.6755 161.291 69.7335 151.888 76.7785L146.587 80.7623C142.336 83.9569 138.083 87.1485 133.827 90.3371C136.643 91.7362 138.62 92.1593 141.702 92.6303C221.494 105.429 298.804 139.014 361.051 190.907L363.116 192.61C386.479 211.924 407.834 233.265 427.193 256.593C428.51 258.175 429.841 259.745 431.187 261.303C436.124 267.044 440.735 273.001 445.304 279.039L447.144 281.465C451.048 286.661 454.678 291.975 458.182 297.446C458.972 298.651 459.763 299.855 460.555 301.057C467.035 310.998 472.939 321.209 478.629 331.621L479.952 334.032C490.563 353.458 499.248 373.561 507.205 394.202L508.112 396.528C532.411 459.154 538.3 527.308 533.707 593.826L536.359 591.825C538.266 590.388 540.177 588.958 542.093 587.536C547.16 583.76 552.068 579.908 556.803 575.724C559.317 573.573 561.966 571.63 564.625 569.663C566.651 568.108 568.562 566.469 570.478 564.781C574.33 561.404 578.359 558.322 582.475 555.275C584.3 553.907 586.097 552.504 587.867 551.066C592.182 548.09 595.457 547.11 600.709 547.252C606.012 548.246 610.34 550.778 613.423 555.254C616.471 560.89 617.202 565.69 615.538 571.991C611.911 579.023 605.957 583.371 599.841 588.182C597.764 589.824 595.695 591.477 593.635 593.139C590.552 595.621 587.465 598.099 584.374 600.573C579.939 604.125 575.509 607.686 571.084 611.255L568.966 612.962L564.737 616.371C562.596 618.097 560.454 619.822 558.311 621.548C554.757 624.408 551.204 627.27 547.653 630.134L543.385 633.572C541.279 635.269 539.173 636.967 537.067 638.666L535.056 640.287C531.434 643.215 527.882 646.227 524.401 649.321C520.128 652.924 517.027 654.734 511.276 654.638C504.105 654.004 499.663 652.411 494.944 646.952C492.961 644.459 491.036 641.92 489.17 639.337C487.454 637.019 485.664 634.855 483.756 632.696C480.714 629.246 477.973 625.634 475.234 621.942C473.027 619.061 470.646 616.357 468.252 613.632C466.614 611.711 465.096 609.742 463.596 607.712C461.593 605.011 459.475 602.398 457.248 599.879C454.628 596.895 452.205 593.821 449.837 590.634C447.52 587.515 445.157 584.511 442.585 581.601C439.023 577.562 435.848 573.275 432.645 568.951C430.766 566.503 428.804 564.231 426.725 561.954C422.256 556.843 419.912 551.54 420.356 544.631C421.353 539.257 423.925 535.418 428.315 532.199C432.962 529.558 437.478 528.95 442.76 529.556C451.493 532.113 456.527 540.68 461.659 547.618C463.214 549.643 464.853 551.555 466.541 553.47C469.161 556.454 471.584 559.528 473.952 562.715C476.269 565.834 478.632 568.838 481.205 571.75C484.822 575.845 488.047 580.2 491.28 584.603C493.001 586.821 494.783 588.71 496.789 590.662C504.124 496.484 482.562 403.63 431.234 323.957L429.63 321.468C428.235 319.326 426.829 317.19 425.414 315.061L423.957 312.797C419.497 305.991 414.657 299.488 409.77 292.985L407.699 290.221C403.597 284.783 399.284 279.507 394.769 274.406C393.892 273.397 393.014 272.387 392.138 271.377C328.722 199.526 238.424 143.586 142.368 130.844L138.269 130.285C134.982 129.837 131.694 129.395 128.405 128.958L130.038 131.102C135.126 137.781 140.205 144.466 145.275 151.158C147.881 154.598 150.492 158.034 153.109 161.467C155.636 164.781 158.155 168.101 160.667 171.426C161.626 172.691 162.588 173.954 163.553 175.215C164.905 176.987 166.251 178.763 167.591 180.545L169.913 183.602C173.799 189.622 174.325 194.307 173.148 201.193C171.749 206.255 169.054 209.036 164.818 212.141C159.201 214.73 155.104 214.729 149.217 213.352C142.679 210.418 138.628 203.943 134.466 198.389L132.361 195.61C130.075 192.585 127.794 189.557 125.517 186.526L120.747 180.204C117.419 175.792 114.094 171.377 110.773 166.96C106.938 161.861 103.096 156.766 99.2489 151.675C95.5407 146.767 91.837 141.855 88.1379 136.939C86.5663 134.852 84.993 132.767 83.418 130.682C81.2195 127.77 79.0256 124.855 76.8362 121.935L74.8605 119.328C70.2774 113.197 67.1715 108.398 67.725 100.558C68.83 93.5503 72.4821 90.3096 77.777 85.9979L79.4553 84.631C85.6232 79.6401 91.9415 74.85 98.2822 70.0813L102.047 67.2411C104.649 65.2779 107.253 63.3169 109.858 61.3581C113.178 58.8594 116.495 56.358 119.809 53.8538C122.389 51.9069 124.971 49.9612 127.553 48.0168L131.222 45.2499C137.374 40.6033 143.537 36.1004 150.092 32.0322C151.512 30.9025 152.898 29.7291 154.246 28.5137C164.229 19.7 175.218 10.6187 188.7 17.3203Z" />
                </mask>
                <path d="M188.7 17.3203C192.371 20.6905 195.297 24.7568 196.896 29.5153C196.804 31.4331 196.628 33.3462 196.407 35.253L196.086 38.3485C194.185 45.1048 187.596 49.2812 182.3 53.4645L179.893 55.3804C170.681 62.6755 161.291 69.7335 151.888 76.7785L146.587 80.7623C142.336 83.9569 138.083 87.1485 133.827 90.3371C136.643 91.7362 138.62 92.1593 141.702 92.6303C221.494 105.429 298.804 139.014 361.051 190.907L363.116 192.61C386.479 211.924 407.834 233.265 427.193 256.593C428.51 258.175 429.841 259.745 431.187 261.303C436.124 267.044 440.735 273.001 445.304 279.039L447.144 281.465C451.048 286.661 454.678 291.975 458.182 297.446C458.972 298.651 459.763 299.855 460.555 301.057C467.035 310.998 472.939 321.209 478.629 331.621L479.952 334.032C490.563 353.458 499.248 373.561 507.205 394.202L508.112 396.528C532.411 459.154 538.3 527.308 533.707 593.826L536.359 591.825C538.266 590.388 540.177 588.958 542.093 587.536C547.16 583.76 552.068 579.908 556.803 575.724C559.317 573.573 561.966 571.63 564.625 569.663C566.651 568.108 568.562 566.469 570.478 564.781C574.33 561.404 578.359 558.322 582.475 555.275C584.3 553.907 586.097 552.504 587.867 551.066C592.182 548.09 595.457 547.11 600.709 547.252C606.012 548.246 610.34 550.778 613.423 555.254C616.471 560.89 617.202 565.69 615.538 571.991C611.911 579.023 605.957 583.371 599.841 588.182C597.764 589.824 595.695 591.477 593.635 593.139C590.552 595.621 587.465 598.099 584.374 600.573C579.939 604.125 575.509 607.686 571.084 611.255L568.966 612.962L564.737 616.371C562.596 618.097 560.454 619.822 558.311 621.548C554.757 624.408 551.204 627.27 547.653 630.134L543.385 633.572C541.279 635.269 539.173 636.967 537.067 638.666L535.056 640.287C531.434 643.215 527.882 646.227 524.401 649.321C520.128 652.924 517.027 654.734 511.276 654.638C504.105 654.004 499.663 652.411 494.944 646.952C492.961 644.459 491.036 641.92 489.17 639.337C487.454 637.019 485.664 634.855 483.756 632.696C480.714 629.246 477.973 625.634 475.234 621.942C473.027 619.061 470.646 616.357 468.252 613.632C466.614 611.711 465.096 609.742 463.596 607.712C461.593 605.011 459.475 602.398 457.248 599.879C454.628 596.895 452.205 593.821 449.837 590.634C447.52 587.515 445.157 584.511 442.585 581.601C439.023 577.562 435.848 573.275 432.645 568.951C430.766 566.503 428.804 564.231 426.725 561.954C422.256 556.843 419.912 551.54 420.356 544.631C421.353 539.257 423.925 535.418 428.315 532.199C432.962 529.558 437.478 528.95 442.76 529.556C451.493 532.113 456.527 540.68 461.659 547.618C463.214 549.643 464.853 551.555 466.541 553.47C469.161 556.454 471.584 559.528 473.952 562.715C476.269 565.834 478.632 568.838 481.205 571.75C484.822 575.845 488.047 580.2 491.28 584.603C493.001 586.821 494.783 588.71 496.789 590.662C504.124 496.484 482.562 403.63 431.234 323.957L429.63 321.468C428.235 319.326 426.829 317.19 425.414 315.061L423.957 312.797C419.497 305.991 414.657 299.488 409.77 292.985L407.699 290.221C403.597 284.783 399.284 279.507 394.769 274.406C393.892 273.397 393.014 272.387 392.138 271.377C328.722 199.526 238.424 143.586 142.368 130.844L138.269 130.285C134.982 129.837 131.694 129.395 128.405 128.958L130.038 131.102C135.126 137.781 140.205 144.466 145.275 151.158C147.881 154.598 150.492 158.034 153.109 161.467C155.636 164.781 158.155 168.101 160.667 171.426C161.626 172.691 162.588 173.954 163.553 175.215C164.905 176.987 166.251 178.763 167.591 180.545L169.913 183.602C173.799 189.622 174.325 194.307 173.148 201.193C171.749 206.255 169.054 209.036 164.818 212.141C159.201 214.73 155.104 214.729 149.217 213.352C142.679 210.418 138.628 203.943 134.466 198.389L132.361 195.61C130.075 192.585 127.794 189.557 125.517 186.526L120.747 180.204C117.419 175.792 114.094 171.377 110.773 166.96C106.938 161.861 103.096 156.766 99.2489 151.675C95.5407 146.767 91.837 141.855 88.1379 136.939C86.5663 134.852 84.993 132.767 83.418 130.682C81.2195 127.77 79.0256 124.855 76.8362 121.935L74.8605 119.328C70.2774 113.197 67.1715 108.398 67.725 100.558C68.83 93.5503 72.4821 90.3096 77.777 85.9979L79.4553 84.631C85.6232 79.6401 91.9415 74.85 98.2822 70.0813L102.047 67.2411C104.649 65.2779 107.253 63.3169 109.858 61.3581C113.178 58.8594 116.495 56.358 119.809 53.8538C122.389 51.9069 124.971 49.9612 127.553 48.0168L131.222 45.2499C137.374 40.6033 143.537 36.1004 150.092 32.0322C151.512 30.9025 152.898 29.7291 154.246 28.5137C164.229 19.7 175.218 10.6187 188.7 17.3203Z" fill="#FEFEFE" />
                <path d="M188.7 17.3203C192.371 20.6905 195.297 24.7568 196.896 29.5153C196.804 31.4331 196.628 33.3462 196.407 35.253L196.086 38.3485C194.185 45.1048 187.596 49.2812 182.3 53.4645L179.893 55.3804C170.681 62.6755 161.291 69.7335 151.888 76.7785L146.587 80.7623C142.336 83.9569 138.083 87.1485 133.827 90.3371C136.643 91.7362 138.62 92.1593 141.702 92.6303C221.494 105.429 298.804 139.014 361.051 190.907L363.116 192.61C386.479 211.924 407.834 233.265 427.193 256.593C428.51 258.175 429.841 259.745 431.187 261.303C436.124 267.044 440.735 273.001 445.304 279.039L447.144 281.465C451.048 286.661 454.678 291.975 458.182 297.446C458.972 298.651 459.763 299.855 460.555 301.057C467.035 310.998 472.939 321.209 478.629 331.621L479.952 334.032C490.563 353.458 499.248 373.561 507.205 394.202L508.112 396.528C532.411 459.154 538.3 527.308 533.707 593.826L536.359 591.825C538.266 590.388 540.177 588.958 542.093 587.536C547.16 583.76 552.068 579.908 556.803 575.724C559.317 573.573 561.966 571.63 564.625 569.663C566.651 568.108 568.562 566.469 570.478 564.781C574.33 561.404 578.359 558.322 582.475 555.275C584.3 553.907 586.097 552.504 587.867 551.066C592.182 548.09 595.457 547.11 600.709 547.252C606.012 548.246 610.34 550.778 613.423 555.254C616.471 560.89 617.202 565.69 615.538 571.991C611.911 579.023 605.957 583.371 599.841 588.182C597.764 589.824 595.695 591.477 593.635 593.139C590.552 595.621 587.465 598.099 584.374 600.573C579.939 604.125 575.509 607.686 571.084 611.255L568.966 612.962L564.737 616.371C562.596 618.097 560.454 619.822 558.311 621.548C554.757 624.408 551.204 627.27 547.653 630.134L543.385 633.572C541.279 635.269 539.173 636.967 537.067 638.666L535.056 640.287C531.434 643.215 527.882 646.227 524.401 649.321C520.128 652.924 517.027 654.734 511.276 654.638C504.105 654.004 499.663 652.411 494.944 646.952C492.961 644.459 491.036 641.92 489.17 639.337C487.454 637.019 485.664 634.855 483.756 632.696C480.714 629.246 477.973 625.634 475.234 621.942C473.027 619.061 470.646 616.357 468.252 613.632C466.614 611.711 465.096 609.742 463.596 607.712C461.593 605.011 459.475 602.398 457.248 599.879C454.628 596.895 452.205 593.821 449.837 590.634C447.52 587.515 445.157 584.511 442.585 581.601C439.023 577.562 435.848 573.275 432.645 568.951C430.766 566.503 428.804 564.231 426.725 561.954C422.256 556.843 419.912 551.54 420.356 544.631C421.353 539.257 423.925 535.418 428.315 532.199C432.962 529.558 437.478 528.95 442.76 529.556C451.493 532.113 456.527 540.68 461.659 547.618C463.214 549.643 464.853 551.555 466.541 553.47C469.161 556.454 471.584 559.528 473.952 562.715C476.269 565.834 478.632 568.838 481.205 571.75C484.822 575.845 488.047 580.2 491.28 584.603C493.001 586.821 494.783 588.71 496.789 590.662C504.124 496.484 482.562 403.63 431.234 323.957L429.63 321.468C428.235 319.326 426.829 317.19 425.414 315.061L423.957 312.797C419.497 305.991 414.657 299.488 409.77 292.985L407.699 290.221C403.597 284.783 399.284 279.507 394.769 274.406C393.892 273.397 393.014 272.387 392.138 271.377C328.722 199.526 238.424 143.586 142.368 130.844L138.269 130.285C134.982 129.837 131.694 129.395 128.405 128.958L130.038 131.102C135.126 137.781 140.205 144.466 145.275 151.158C147.881 154.598 150.492 158.034 153.109 161.467C155.636 164.781 158.155 168.101 160.667 171.426C161.626 172.691 162.588 173.954 163.553 175.215C164.905 176.987 166.251 178.763 167.591 180.545L169.913 183.602C173.799 189.622 174.325 194.307 173.148 201.193C171.749 206.255 169.054 209.036 164.818 212.141C159.201 214.73 155.104 214.729 149.217 213.352C142.679 210.418 138.628 203.943 134.466 198.389L132.361 195.61C130.075 192.585 127.794 189.557 125.517 186.526L120.747 180.204C117.419 175.792 114.094 171.377 110.773 166.96C106.938 161.861 103.096 156.766 99.2489 151.675C95.5407 146.767 91.837 141.855 88.1379 136.939C86.5663 134.852 84.993 132.767 83.418 130.682C81.2195 127.77 79.0256 124.855 76.8362 121.935L74.8605 119.328C70.2774 113.197 67.1715 108.398 67.725 100.558C68.83 93.5503 72.4821 90.3096 77.777 85.9979L79.4553 84.631C85.6232 79.6401 91.9415 74.85 98.2822 70.0813L102.047 67.2411C104.649 65.2779 107.253 63.3169 109.858 61.3581C113.178 58.8594 116.495 56.358 119.809 53.8538C122.389 51.9069 124.971 49.9612 127.553 48.0168L131.222 45.2499C137.374 40.6033 143.537 36.1004 150.092 32.0322C151.512 30.9025 152.898 29.7291 154.246 28.5137C164.229 19.7 175.218 10.6187 188.7 17.3203Z" stroke="black" strokeWidth="25" mask={`url(#${maskId})`} />
            </svg>
        </div>
    );
}

export const VideoCanvas = forwardRef<VideoCanvasHandle, VideoCanvasProps>(function VideoCanvas({
    videoRef,
    videoUrl,
    padding,
    roundedCorners,
    shadows,
    aspectRatio = "auto",
    customAspectRatio,
    cropArea,
    backgroundTab = "wallpaper",
    selectedWallpaper = -1,
    backgroundBlur = 0,
    selectedImageUrl = "",
    unsplashOverrideUrl = "",
    backgroundColorCss,
    onTimeUpdate,
    onLoadedMetadata,
    onEnded,
    isScrubbing = false,
    scrubTime = 0,
    getThumbnailForTime,
    zoomFragments = [],
    currentTime = 0,
    mockupId = "none",
    mockupConfig,
    onVideoUpload,
    isUploading = false,
    videoTransform = { rotation: 0, translateX: 0, translateY: 0 },
    onVideoTransformChange,
    canvasElements = [],
    selectedElementId = null,
    onElementUpdate,
    onElementSelect,
    // Cursor props
    cursorConfig = DEFAULT_CURSOR_CONFIG,
    cursorData = EMPTY_CURSOR_DATA,
}, ref) {
    const wallpaperUrl = getWallpaperUrl(selectedWallpaper);

    // Get current thumbnail for scrubbing preview
    const currentThumbnail = useMemo<VideoThumbnail | null>(() => {
        if (!isScrubbing || !getThumbnailForTime) return null;
        return getThumbnailForTime(scrubTime);
    }, [isScrubbing, scrubTime, getThumbnailForTime]);

    // Find active zoom fragment based on current time
    const activeZoomFragment = useMemo<ZoomFragment | null>(() => {
        if (!zoomFragments.length) return null;
        return zoomFragments.find(f => currentTime >= f.startTime && currentTime <= f.endTime) || null;
    }, [zoomFragments, currentTime]);

    // Calculate zoom transform for visual preview
    // Uses fragment's speed for entry, and a smooth default for exit
    const zoomTransform = useMemo(() => {
        // Default smooth exit transition (speed 3 = ~1.4s for nice smooth exit)
        if (!activeZoomFragment) {
            // Usar la velocidad del último fragmento que terminó
            const lastFragment = zoomFragments
                .filter(f => f.endTime < currentTime)
                .sort((a, b) => b.endTime - a.endTime)[0];
            const exitMs = lastFragment ? speedToTransitionMs(lastFragment.speed) : speedToTransitionMs(3);
            return { scale: 1, translateX: 0, translateY: 0, transitionMs: exitMs };
        }

        const scale = zoomLevelToFactor(activeZoomFragment.zoomLevel);
        // Calculate translation to keep focus point centered
        const translateX = (50 - activeZoomFragment.focusX) * (scale - 1) * 2;
        const translateY = (50 - activeZoomFragment.focusY) * (scale - 1) * 2;
        const transitionMs = speedToTransitionMs(activeZoomFragment.speed);

        return { scale, translateX, translateY, transitionMs };
    }, [activeZoomFragment, zoomFragments, currentTime]);

    // Calculate current cursor position from cursor data
    const cursorPosition = useMemo<CursorKeyframe | null>(() => {
        if (!cursorConfig.visible || cursorConfig.style === "none" || !cursorData.hasCursorData) {
            return null;
        }
        return interpolateCursorPosition(cursorData.keyframes, currentTime, cursorConfig.smoothing);
    }, [cursorConfig.visible, cursorConfig.style, cursorConfig.smoothing, cursorData.hasCursorData, cursorData.keyframes, currentTime]);

    // Get cursor SVG data URL for rendering
    const cursorSvgDataUrl = useMemo(() => {
        if (!cursorPosition || cursorConfig.style === "none") return null;
        return getCursorSvgDataUrl(cursorConfig.style, cursorPosition.state, cursorConfig.color, cursorConfig.size);
    }, [cursorPosition, cursorConfig.style, cursorConfig.color, cursorConfig.size]);

    // Preload cursor image for canvas rendering
    const cursorImageRef = useRef<HTMLImageElement | null>(null);
    useEffect(() => {
        if (cursorSvgDataUrl) {
            const img = new Image();
            img.src = cursorSvgDataUrl;
            img.onload = () => {
                cursorImageRef.current = img;
            };
        } else {
            cursorImageRef.current = null;
        }
    }, [cursorSvgDataUrl]);

    // Determinar qué background mostrar basado en el tab activo
    const shouldShowUnsplashOverride = backgroundTab === "wallpaper" && unsplashOverrideUrl !== "";
    const shouldShowWallpaper = backgroundTab === "wallpaper" && selectedWallpaper >= 0 && !shouldShowUnsplashOverride;
    const shouldShowCustomImage = backgroundTab === "image" && selectedImageUrl !== "";
    const shouldShowCustomColor = backgroundTab === "color" && !!backgroundColorCss;

    // Canvas para exportación (no visible, solo para renderizado)
    const exportCanvasRef = useRef<HTMLCanvasElement>(null);
    const wallpaperImageRef = useRef<HTMLImageElement | null>(null);
    const customImageRef = useRef<HTMLImageElement | null>(null);

    // Calcular dimensiones de exportación según aspect ratio
    const exportDimensions = useMemo(() => {
        // For auto and custom, use the actual video dimensions if available
        if ((aspectRatio === "auto" || aspectRatio === "custom") && customAspectRatio) {
            return { width: customAspectRatio.width, height: customAspectRatio.height };
        }
        // Otherwise use standard dimensions
        const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];
        return dims || { width: 1920, height: 1080 };
    }, [aspectRatio, customAspectRatio]);

    // On-canvas controls state
    const [isVideoHovered, setIsVideoHovered] = useState(false);
    const [isDraggingVideo, setIsDraggingVideo] = useState(false);
    const [isDraggingRotation, setIsDraggingRotation] = useState(false);
    const [videoHoverCorner, setVideoHoverCorner] = useState<Corner>("top-right");
    const dragStartPos = useRef({ x: 0, y: 0, initialRotation: 0, initialTranslateX: 0, initialTranslateY: 0 });
    const lastAngleRef = useRef<number | null>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    // Canvas elements controls state
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [isDraggingElementRotation, setIsDraggingElementRotation] = useState(false);
    const elementDragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0, initialRotation: 0 });
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // Canvas element images cache (only for actual images, not SVGs)
    const elementImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

    // Actualizar canvas dimensions cuando cambia el aspect ratio
    useEffect(() => {
        const canvas = exportCanvasRef.current;
        if (canvas) {
            canvas.width = exportDimensions.width;
            canvas.height = exportDimensions.height;
        }
    }, [exportDimensions]);

    // Precargar imagen de wallpaper para el canvas
    useEffect(() => {
        if (shouldShowWallpaper && wallpaperUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = wallpaperUrl;
            img.onload = () => {
                wallpaperImageRef.current = img;
            };
        } else {
            wallpaperImageRef.current = null;
        }
    }, [shouldShowWallpaper, wallpaperUrl]);

    // Precargar imagen custom para el canvas (Image tab o Unsplash override en wallpaper tab)
    const imageUrlToLoad = shouldShowCustomImage ? selectedImageUrl : shouldShowUnsplashOverride ? unsplashOverrideUrl : null;
    useEffect(() => {
        if (imageUrlToLoad) {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Prevenir problemas de CORS al exportar
            img.src = imageUrlToLoad;
            img.onload = () => {
                customImageRef.current = img;
            };
        } else {
            customImageRef.current = null;
        }
    }, [imageUrlToLoad]);

    // Preload canvas element images (only for image elements, not SVGs)
    useEffect(() => {
        const cache = elementImagesRef.current;
        const loadedPaths = new Set(cache.keys());
        const currentPaths = new Set(
            canvasElements
                .filter((el): el is ImageElement => el.type === "image")
                .map(el => el.imagePath)
        );

        // Remove images not in use anymore
        for (const path of loadedPaths) {
            if (!currentPaths.has(path)) {
                cache.delete(path);
            }
        }

        // Load new images with enhanced error handling
        for (const element of canvasElements) {
            if (element.type === "image") {
                const imageElement = element as ImageElement;
                if (!cache.has(imageElement.imagePath)) {
                    const img = new Image();
                    img.crossOrigin = "anonymous"; // Prevenir problemas de CORS al exportar

                    img.onload = () => {
                        cache.set(imageElement.imagePath, img);
                    };

                    img.onerror = () => {
                        console.error(`Failed to load canvas element image: ${imageElement.imagePath}`);
                    };

                    img.src = imageElement.imagePath;
                }
            }
        }
    }, [canvasElements]);

    useEffect(() => {
        if (!isDraggingVideo && !isDraggingRotation) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!onVideoTransformChange) return;

            if (isDraggingRotation) {
                const container = videoContainerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const rawAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
                if (lastAngleRef.current === null) lastAngleRef.current = rawAngle;
                let delta = rawAngle - lastAngleRef.current;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                lastAngleRef.current = rawAngle;
                onVideoTransformChange({ ...videoTransform, rotation: videoTransform.rotation + delta });
            } else if (isDraggingVideo) {
                const deltaX = e.clientX - dragStartPos.current.x;
                const deltaY = e.clientY - dragStartPos.current.y;
                const container = videoContainerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const percentX = (deltaX / rect.width) * 100;
                const percentY = (deltaY / rect.height) * 100;
                onVideoTransformChange({
                    ...videoTransform,
                    translateX: dragStartPos.current.initialTranslateX + percentX,
                    translateY: dragStartPos.current.initialTranslateY + percentY,
                });
            }
        };

        const handleMouseUp = () => {
            setIsDraggingVideo(false);
            setIsDraggingRotation(false);
            lastAngleRef.current = null;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingVideo, isDraggingRotation, videoTransform, onVideoTransformChange]);

    // Canvas elements drag & drop handlers
    useEffect(() => {
        if (!isDraggingElement && !isDraggingElementRotation) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!selectedElementId || !onElementUpdate) return;
            const selectedElement = canvasElements.find(el => el.id === selectedElementId);
            if (!selectedElement) return;

            if (isDraggingElementRotation) {
                const container = canvasContainerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width * (selectedElement.x / 100);
                const centerY = rect.top + rect.height * (selectedElement.y / 100);
                const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
                const startAngle = Math.atan2(
                    elementDragStart.current.y - centerY,
                    elementDragStart.current.x - centerX
                ) * (180 / Math.PI);
                let deltaAngle = currentAngle - startAngle;
                if (deltaAngle > 180) deltaAngle -= 360;
                if (deltaAngle < -180) deltaAngle += 360;
                onElementUpdate(selectedElementId, { rotation: elementDragStart.current.initialRotation + deltaAngle });
            } else if (isDraggingElement) {
                const container = canvasContainerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const deltaX = e.clientX - elementDragStart.current.x;
                const deltaY = e.clientY - elementDragStart.current.y;
                const percentX = (deltaX / rect.width) * 100;
                const percentY = (deltaY / rect.height) * 100;
                onElementUpdate(selectedElementId, {
                    x: Math.max(0, Math.min(100, elementDragStart.current.initialX + percentX)),
                    y: Math.max(0, Math.min(100, elementDragStart.current.initialY + percentY)),
                });
            }
        };

        const handleMouseUp = () => {
            setIsDraggingElement(false);
            setIsDraggingElementRotation(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingElement, isDraggingElementRotation, selectedElementId, canvasElements, onElementUpdate]);

    // Helper function to render canvas elements (SVG, images, text)
    // If behindVideo is true, only render elements with zIndex < VIDEO_Z_INDEX
    // If behindVideo is false, only render elements with zIndex >= VIDEO_Z_INDEX
    const renderCanvasElements = async (
        ctx: CanvasRenderingContext2D,
        elements: typeof canvasElements,
        canvasWidth: number,
        canvasHeight: number,
        behindVideo: boolean
    ) => {
        const filteredElements = elements.filter(el =>
            behindVideo ? el.zIndex < VIDEO_Z_INDEX : el.zIndex >= VIDEO_Z_INDEX
        );
        const sortedElements = [...filteredElements].sort((a, b) => a.zIndex - b.zIndex);

        // Use smaller dimension as reference for consistent scaling across different aspect ratios
        const referenceSize = Math.min(canvasWidth, canvasHeight);

        for (const element of sortedElements) {
            if (element.type === "svg") {
                const svgElement = element as SvgElement;
                const svgDataUrl = getSvgDataUrl(svgElement.svgId, svgElement.color || "#FFFFFF");
                if (!svgDataUrl) continue;

                const svgImage = new Image();
                svgImage.src = svgDataUrl;

                await new Promise<void>((resolve) => {
                    if (svgImage.complete) {
                        resolve();
                    } else {
                        svgImage.onload = () => resolve();
                        svgImage.onerror = () => resolve();
                    }
                });

                ctx.save();

                const elemX = (svgElement.x / 100) * canvasWidth;
                const elemY = (svgElement.y / 100) * canvasHeight;
                // Use reference size for both width and height to maintain square aspect ratio for SVGs
                const elemWidth = (svgElement.width / 100) * referenceSize;
                const elemHeight = (svgElement.height / 100) * referenceSize;

                // Translate to element position, rotate, then draw centered
                ctx.translate(elemX, elemY);
                ctx.rotate((svgElement.rotation * Math.PI) / 180);
                ctx.globalAlpha = svgElement.opacity;

                ctx.drawImage(
                    svgImage,
                    -elemWidth / 2,
                    -elemHeight / 2,
                    elemWidth,
                    elemHeight
                );

                ctx.restore();
            } else if (element.type === "image") {
                const img = elementImagesRef.current.get(element.imagePath);
                if (!img) continue;

                ctx.save();

                const elemX = (element.x / 100) * canvasWidth;
                const elemY = (element.y / 100) * canvasHeight;

                // Calculate element dimensions using reference size to maintain consistent scaling
                const elemWidth = (element.width / 100) * referenceSize;
                const elemHeight = (element.height / 100) * referenceSize;

                // For images, maintain the original aspect ratio
                const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                let finalWidth = elemWidth;
                let finalHeight = elemHeight;

                // Apply object-contain logic: scale to fit within element bounds while maintaining aspect ratio
                const elementAspectRatio = elemWidth / elemHeight;
                if (imgAspectRatio > elementAspectRatio) {
                    // Image is wider - fit to width
                    finalHeight = elemWidth / imgAspectRatio;
                } else {
                    // Image is taller - fit to height
                    finalWidth = elemHeight * imgAspectRatio;
                }

                ctx.translate(elemX, elemY);
                ctx.rotate((element.rotation * Math.PI) / 180);
                ctx.globalAlpha = element.opacity;

                ctx.drawImage(
                    img,
                    -finalWidth / 2,
                    -finalHeight / 2,
                    finalWidth,
                    finalHeight
                );

                ctx.restore();
            } else if (element.type === "text") {
                ctx.save();

                const elemX = (element.x / 100) * canvasWidth;
                const elemY = (element.y / 100) * canvasHeight;

                ctx.translate(elemX, elemY);
                ctx.rotate((element.rotation * Math.PI) / 180);
                ctx.globalAlpha = element.opacity;

                // Scale font size proportionally to canvas size using reference dimension
                // Base reference is 1080px (typical preview height)
                const scaledFontSize = element.fontSize * (referenceSize / 1080);
                const fontWeight = element.fontWeight === 'normal' ? '400' : element.fontWeight === 'medium' ? '500' : '700';
                ctx.font = `${fontWeight} ${scaledFontSize}px ${element.fontFamily}`;
                ctx.fillStyle = element.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.fillText(element.content, 0, 0);

                ctx.restore();
            }
        }
    };

    // Función para dibujar un frame en el canvas de exportación
    const drawFrame = async () => {
        const canvas = exportCanvasRef.current;
        const ctx = canvas?.getContext('2d', {
            alpha: true,
            desynchronized: false,
            willReadFrequently: false
        });
        const video = videoRef.current;

        if (!canvas || !ctx || !video) return;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calcular propiedades escaladas
        const paddingPercent = padding * 0.5 / 100;
        const scaledPaddingX = calculateScaledPadding(canvasWidth, paddingPercent);
        const scaledPaddingY = calculateScaledPadding(canvasHeight, paddingPercent);
        const scaledRadius = roundedCorners * (canvasWidth / 896);
        const scaledShadowBlur = shadows * (canvasWidth / 896) * 0.8;

        // Reset canvas transformation matrix and clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const frameTime = video.currentTime;
        const zoomState = calculateSmoothZoom(frameTime, zoomFragments);

        ctx.save();

        // Apply zoom transform to entire canvas (affects everything including background)
        if (zoomState.scale !== 1) {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;

            // Calculate focus point offset (relative to entire canvas)
            const focusOffsetX = (50 - zoomState.focusX) / 100 * canvasWidth * (zoomState.scale - 1) * 2;
            const focusOffsetY = (50 - zoomState.focusY) / 100 * canvasHeight * (zoomState.scale - 1) * 2;

            ctx.translate(centerX + focusOffsetX, centerY + focusOffsetY);
            ctx.scale(zoomState.scale, zoomState.scale);
            ctx.translate(-centerX, -centerY);
        }

        const backgroundImage = (shouldShowCustomImage || shouldShowUnsplashOverride) ? customImageRef.current : (shouldShowWallpaper ? wallpaperImageRef.current : null);

        // 1. Dibujar fondo
        if (shouldShowCustomColor && backgroundColorCss) {
            applyCanvasBackground(ctx, backgroundColorCss, canvasWidth, canvasHeight);
        } else if (backgroundImage) {
            ctx.save();

            if (backgroundBlur > 0) {
                ctx.filter = `blur(${backgroundBlur * 0.8}px)`;
                const overflow = backgroundBlur * 2;
                ctx.drawImage(
                    backgroundImage,
                    -overflow,
                    -overflow,
                    canvasWidth + overflow * 2,
                    canvasHeight + overflow * 2
                );
            } else {
                ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
            }

            ctx.restore();
        }

        // 2. Render elements BEHIND video (zIndex < VIDEO_Z_INDEX) - before video transform
        await renderCanvasElements(ctx, canvasElements, canvasWidth, canvasHeight, true);

        // 3. Calcular área disponible para el mockup/video
        const availableWidth = canvasWidth - scaledPaddingX * 2;
        const availableHeight = canvasHeight - scaledPaddingY * 2;

        // Obtener las dimensiones reales del video (considerando crop si existe)
        let videoSourceWidth = video.videoWidth;
        let videoSourceHeight = video.videoHeight;

        if (cropArea && (cropArea.width < 100 || cropArea.height < 100)) {
            videoSourceWidth = (cropArea.width / 100) * video.videoWidth;
            videoSourceHeight = (cropArea.height / 100) * video.videoHeight;
        }

        // Calcular aspect ratio del video fuente
        const videoAspectRatio = videoSourceWidth / videoSourceHeight;
        const availableAspectRatio = availableWidth / availableHeight;

        // Calcular dimensiones del contenedor (mockup o video directo)
        let containerWidth: number;
        let containerHeight: number;

        if (videoAspectRatio > availableAspectRatio) {
            containerWidth = availableWidth;
            containerHeight = availableWidth / videoAspectRatio;
        } else {
            containerHeight = availableHeight;
            containerWidth = availableHeight * videoAspectRatio;
        }

        // Centrar el contenedor en el área disponible
        const containerX = scaledPaddingX + (availableWidth - containerWidth) / 2;
        const containerY = scaledPaddingY + (availableHeight - containerHeight) / 2;

        // 4. Aplicar transformaciones del video (rotación y traslación)
        ctx.save();

        // Determinar el centro real del contenedor para rotar sobre su propio eje
        const centerX = containerX + containerWidth / 2;
        const centerY = containerY + containerHeight / 2;

        // Calcular traslación en píxeles basada en el tamaño del contenedor
        const translateXPx = (videoTransform.translateX / 100) * containerWidth;
        const translateYPx = (videoTransform.translateY / 100) * containerHeight;

        // Mover el origen al centro, trasladar, rotar, y devolver el origen a la esquina
        ctx.translate(centerX + translateXPx, centerY + translateYPx);
        ctx.rotate((videoTransform.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        // 5. Dibujar sombra del contenedor (ahora rotará y se moverá con todo lo demás)
        if (shadows > 0 && !SELF_SHADOWING_MOCKUPS.includes(mockupId)) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = scaledShadowBlur;
            ctx.shadowOffsetY = scaledShadowBlur * 0.3;

            ctx.fillStyle = 'black';
            drawRoundedRect(ctx, containerX, containerY, containerWidth, containerHeight, scaledRadius);
            ctx.fill();
            ctx.restore();
        }

        // 6. Determinar si hay mockup activo y dibujarlo
        const hasMockup = mockupId && mockupId !== "none";
        const currentMockupConfig = mockupConfig || DEFAULT_MOCKUP_CONFIG;

        let videoX = containerX;
        let videoY = containerY;
        let videoWidth = containerWidth;
        let videoHeight = containerHeight;
        let videoRadius = scaledRadius;

        if (hasMockup) {
            const mockupShadowBlur = SELF_SHADOWING_MOCKUPS.includes(mockupId) ? scaledShadowBlur : 0;
            const mockupResult = drawMockupToCanvas(
                ctx,
                mockupId,
                currentMockupConfig,
                containerX,
                containerY,
                containerWidth,
                containerHeight,
                scaledRadius,
                mockupShadowBlur
            );

            videoX = mockupResult.contentX;
            videoY = mockupResult.contentY;
            videoWidth = mockupResult.contentWidth;
            videoHeight = mockupResult.contentHeight;
            videoRadius = mockupId === "iphone-slim" ? scaledRadius * 1.8 : scaledRadius;
        }

        // 7. Dibujar video con esquinas redondeadas
        ctx.save();
        const needsBottomOnlyRadius = hasMockup && BOTTOM_ONLY_RADIUS_MOCKUPS.includes(mockupId);

        if (videoRadius > 0) {
            if (needsBottomOnlyRadius) {
                drawRoundedRectBottomOnly(ctx, videoX, videoY, videoWidth, videoHeight, videoRadius);
            } else {
                drawRoundedRect(ctx, videoX, videoY, videoWidth, videoHeight, videoRadius);
            }
            ctx.clip();
        } else {
            ctx.beginPath();
            ctx.rect(videoX, videoY, videoWidth, videoHeight);
            ctx.clip();
        }

        // Aplicar crop si existe
        if (cropArea && (cropArea.width < 100 || cropArea.height < 100 || cropArea.x > 0 || cropArea.y > 0)) {
            const sourceX = (cropArea.x / 100) * video.videoWidth;
            const sourceY = (cropArea.y / 100) * video.videoHeight;
            const sourceWidth = (cropArea.width / 100) * video.videoWidth;
            const sourceHeight = (cropArea.height / 100) * video.videoHeight;

            ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, videoX, videoY, videoWidth, videoHeight);
        } else {
            ctx.drawImage(video, videoX, videoY, videoWidth, videoHeight);
        }

        ctx.restore();
        ctx.restore();

        // 8. Render elements ABOVE video (zIndex >= VIDEO_Z_INDEX)
        await renderCanvasElements(ctx, canvasElements, canvasWidth, canvasHeight, false);

        // 9. Render cursor overlay if enabled and data available
        if (cursorConfig.visible && cursorConfig.style !== "none" && cursorData.hasCursorData) {
            const frameTime = video.currentTime;
            const cursorPos = interpolateCursorPosition(cursorData.keyframes, frameTime, cursorConfig.smoothing);

            if (cursorPos) {
                // Get cursor image from cache
                const cursorDataUrl = getCursorSvgDataUrl(cursorConfig.style, cursorPos.state, cursorConfig.color, cursorConfig.size);
                if (cursorDataUrl) {
                    const cursorImg = new Image();
                    cursorImg.src = cursorDataUrl;

                    // Wait for cursor image to load
                    await new Promise<void>((resolve) => {
                        if (cursorImg.complete) {
                            resolve();
                        } else {
                            cursorImg.onload = () => resolve();
                            cursorImg.onerror = () => resolve();
                        }
                    });

                    // Calculate cursor position relative to the video area
                    // The cursor positions stored are percentages of the video dimensions
                    const cursorX = videoX + (cursorPos.x / 100) * videoWidth;
                    const cursorY = videoY + (cursorPos.y / 100) * videoHeight;

                    // Scale cursor size based on canvas dimensions
                    const cursorScale = canvasWidth / 1920; // Reference 1920px
                    const scaledCursorSize = cursorConfig.size * cursorScale;

                    ctx.save();
                    ctx.globalAlpha = 1;

                    // Draw click effect if clicking
                    if (cursorPos.clicking && cursorConfig.clickEffect !== "none") {
                        ctx.save();
                        const effectSize = scaledCursorSize * 2;

                        if (cursorConfig.clickEffect === "ripple") {
                            // Ripple effect - expanding circles
                            ctx.beginPath();
                            ctx.arc(cursorX, cursorY, effectSize, 0, Math.PI * 2);
                            ctx.strokeStyle = cursorConfig.clickEffectColor;
                            ctx.lineWidth = 3 * cursorScale;
                            ctx.globalAlpha = 0.5;
                            ctx.stroke();
                        } else if (cursorConfig.clickEffect === "ring") {
                            // Ring effect - solid ring
                            ctx.beginPath();
                            ctx.arc(cursorX, cursorY, effectSize * 0.8, 0, Math.PI * 2);
                            ctx.strokeStyle = cursorConfig.clickEffectColor;
                            ctx.lineWidth = 4 * cursorScale;
                            ctx.globalAlpha = 0.7;
                            ctx.stroke();
                        }

                        ctx.restore();
                    }

                    // Draw cursor image
                    // Cursor hotspot is typically at top-left for arrow cursors
                    ctx.drawImage(
                        cursorImg,
                        cursorX,
                        cursorY,
                        scaledCursorSize,
                        scaledCursorSize
                    );

                    ctx.restore();
                }
            }
        }

        ctx.restore();
    };

    // Exponer métodos para exportación
    useImperativeHandle(ref, () => ({
        getExportCanvas: () => exportCanvasRef.current,
        drawFrame,
    }));

    return (
        <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 overflow-hidden bg-[#09090B] p-2 sm:p-4 lg:p-1">
            {/* Canvas oculto para exportación */}
            <canvas
                ref={exportCanvasRef}
                width={exportDimensions.width}
                height={exportDimensions.height}
                className="hidden"
            />

            {/* Preview visual - contenedor con tamaño dinámico según aspect ratio */}
            <div
                className="relative h-full max-h-full w-full max-w-full shrink-0 overflow-hidden border border-white/20 rounded-xl transition-all duration-300"
                style={{
                    aspectRatio: getAspectRatioStyle(aspectRatio, customAspectRatio ?? undefined),
                    maxWidth: getMaxWidth(aspectRatio, customAspectRatio ?? undefined),
                }}
                onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('[data-canvas-element]') && onElementSelect) {
                        onElementSelect(null);
                    }
                }}
            >
                {/* Zoom container - applies zoom to entire composition (background + video) */}
                <div
                    className="absolute inset-0 origin-center"
                    style={{
                        transform: `scale(${zoomTransform.scale}) translate(${zoomTransform.translateX}%, ${zoomTransform.translateY}%)`,
                        transition: `transform ${zoomTransform.transitionMs}ms ${ZOOM_EASING}`,
                    }}
                >
                    {/* Capa 1: Fondo (siempre llena todo el contenedor) */}
                    <div
                        className="absolute inset-0 overflow-hidden"
                    >
                        <div
                            className="absolute transition-all duration-200"
                            style={{
                                inset: backgroundBlur > 0 ? `-${backgroundBlur}px` : '0',
                                ...(shouldShowCustomColor && backgroundColorCss
                                    ? // Color sólido o gradiente CSS
                                    backgroundColorCss.startsWith('#') || backgroundColorCss.startsWith('rgb')
                                        ? { backgroundColor: backgroundColorCss }
                                        : { backgroundImage: backgroundColorCss }
                                    : (shouldShowCustomImage || shouldShowUnsplashOverride)
                                        ? // Imagen personalizada o Unsplash override
                                        {
                                            backgroundImage: `url('${shouldShowCustomImage ? selectedImageUrl : unsplashOverrideUrl}')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }
                                        : shouldShowWallpaper
                                            ? // Wallpaper
                                            {
                                                backgroundImage: `url('${wallpaperUrl}')`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }
                                            :
                                            { backgroundColor: 'transparent' }
                                ),
                                filter: backgroundBlur > 0 ? `blur(${backgroundBlur * 0.4}px)` : 'none',
                            }}
                        />
                    </div>

                    {/* Capa 2A: Canvas elements BEHIND video (zIndex < VIDEO_Z_INDEX) */}
                    <CanvasElementsLayer
                        canvasContainerRef={canvasContainerRef}
                        canvasElements={canvasElements}
                        selectedElementId={selectedElementId}
                        hoveredElementId={hoveredElementId}
                        isDraggingElement={isDraggingElement}
                        behindVideo={true}
                        onElementSelect={onElementSelect}
                        onElementUpdate={onElementUpdate}
                        setHoveredElementId={setHoveredElementId}
                        setIsDraggingElement={setIsDraggingElement}
                        setIsDraggingElementRotation={setIsDraggingElementRotation}
                        elementDragStart={elementDragStart}
                        layerZIndex={1}
                    />

                    {/* Capa 2B: Video con padding, esquinas redondeadas y sombras */}
                    <div
                        className="absolute inset-0 flex items-center justify-center transition-all duration-200"
                        style={{ padding: `${padding * 0.5}%`, zIndex: 2, pointerEvents: 'none' }}
                    >
                        <div
                            ref={videoContainerRef}
                            className="relative flex w-full h-full items-center justify-center max-w-full max-h-full"
                            style={{
                                transform: `translate(${videoTransform.translateX}%, ${videoTransform.translateY}%) rotate(${videoTransform.rotation}deg)`,
                                cursor: isDraggingVideo ? 'move' : (isVideoHovered && videoUrl ? 'move' : 'default'),
                                transition: isDraggingVideo || isDraggingRotation ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                pointerEvents: 'auto',
                            }}
                            onMouseEnter={() => videoUrl && setIsVideoHovered(true)}
                            onMouseLeave={() => setIsVideoHovered(false)}
                            onMouseDown={(e) => {
                                if (!videoUrl || !onVideoTransformChange) return;
                                // Only start dragging if not clicking on rotation handle
                                if ((e.target as HTMLElement).closest('[data-rotation-handle]')) return;

                                e.preventDefault();
                                setIsDraggingVideo(true);
                                dragStartPos.current = {
                                    x: e.clientX,
                                    y: e.clientY,
                                    initialRotation: videoTransform.rotation,
                                    initialTranslateX: videoTransform.translateX,
                                    initialTranslateY: videoTransform.translateY,
                                };
                            }}
                            onMouseMove={(e) => { if (videoUrl) setVideoHoverCorner(getNearestCorner(e, videoTransform.rotation)); }}
                        >
                            <div className="relative">
                                {/* Rotation handle */}
                                {isVideoHovered && videoUrl && onVideoTransformChange && (
                                    <div
                                        data-rotation-handle style={getCornerStyle(videoHoverCorner, -14)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            lastAngleRef.current = null;
                                            setIsDraggingRotation(true);
                                            dragStartPos.current = {
                                                x: e.clientX,
                                                y: e.clientY,
                                                initialRotation: videoTransform.rotation,
                                                initialTranslateX: videoTransform.translateX,
                                                initialTranslateY: videoTransform.translateY,
                                            };
                                        }}
                                    >
                                        <RotationHandleIcon corner={videoHoverCorner} color="#e5e7eb" />
                                    </div>
                                )}
                                {isVideoHovered && videoUrl && !isDraggingVideo && !isDraggingRotation && (
                                    <div
                                        className="absolute -inset-px border border-white pointer-events-none z-10 opacity-80"
                                        style={{ borderRadius: `${roundedCorners + 1}px` }}
                                    />
                                )}
                                <MockupWrapper
                                    mockupId={mockupId}
                                    config={mockupConfig ?? DEFAULT_MOCKUP_CONFIG}
                                    roundedCorners={roundedCorners}
                                    shadows={shadows}
                                >
                                    {videoUrl ? (
                                        <div className="relative flex items-center justify-center overflow-hidden max-w-full max-h-full rounded-[inherit]"
                                        >                                    {/* Video element */}
                                            <video
                                                ref={videoRef}
                                                src={videoUrl}
                                                preload="auto"
                                                playsInline
                                                className="max-w-full max-h-full object-contain"
                                                style={{
                                                    // Aplicar crop usando object-view-box (CSS nativo)
                                                    ...(cropArea && (cropArea.width < 100 || cropArea.height < 100 || cropArea.x > 0 || cropArea.y > 0) ? {
                                                        objectViewBox: `inset(${cropArea.y}% ${100 - cropArea.x - cropArea.width}% ${100 - cropArea.y - cropArea.height}% ${cropArea.x}%)`,
                                                    } : {}),
                                                    opacity: currentThumbnail ? 0 : 1,
                                                }}
                                                onTimeUpdate={onTimeUpdate}
                                                onLoadedMetadata={onLoadedMetadata}
                                                onEnded={onEnded}
                                            />

                                            {currentThumbnail && (
                                                <img
                                                    src={currentThumbnail.dataUrl}
                                                    alt="Preview"
                                                    crossOrigin="anonymous"
                                                    className="absolute inset-0 w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full aspect-video min-w-75 bg-[#1E1E1E] border border-white/10 flex flex-col overflow-hidden">                                    <PlaceholderEditor
                                            onVideoUpload={onVideoUpload}
                                            isUploading={isUploading}
                                        />
                                        </div>
                                    )}
                                </MockupWrapper>
                            </div>
                        </div>
                    </div>

                    {/* Capa 3: Canvas elements ABOVE video (zIndex >= VIDEO_Z_INDEX) */}
                    <CanvasElementsLayer
                        canvasContainerRef={canvasContainerRef}
                        canvasElements={canvasElements}
                        selectedElementId={selectedElementId}
                        hoveredElementId={hoveredElementId}
                        isDraggingElement={isDraggingElement}
                        behindVideo={false}
                        onElementSelect={onElementSelect}
                        onElementUpdate={onElementUpdate}
                        setHoveredElementId={setHoveredElementId}
                        setIsDraggingElement={setIsDraggingElement}
                        setIsDraggingElementRotation={setIsDraggingElementRotation}
                        elementDragStart={elementDragStart}
                        layerZIndex={3}
                    />

                    {/* Capa 4: Cursor overlay for preview */}
                    {cursorPosition && cursorSvgDataUrl && cursorConfig.visible && cursorConfig.style !== "none" && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                zIndex: 4,
                                padding: `${padding * 0.5}%`,
                            }}
                        >
                            <div className="relative w-full h-full">
                                {/* Click effect */}
                                {cursorPosition.clicking && cursorConfig.clickEffect !== "none" && (
                                    <div
                                        className="absolute rounded-full animate-ping"
                                        style={{
                                            left: `${cursorPosition.x}%`,
                                            top: `${cursorPosition.y}%`,
                                            width: cursorConfig.size * 2,
                                            height: cursorConfig.size * 2,
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: cursorConfig.clickEffectColor,
                                            opacity: cursorConfig.clickEffect === "ripple" ? 0.3 : 0.5,
                                        }}
                                    />
                                )}
                                {/* Cursor image */}
                                <img
                                    src={cursorSvgDataUrl}
                                    alt="cursor"
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: `${cursorPosition.x}%`,
                                        top: `${cursorPosition.y}%`,
                                        width: cursorConfig.size,
                                        height: cursorConfig.size,
                                        // Cursor hotspot at top-left for arrow cursors
                                        transform: 'translate(0, 0)',
                                        transition: cursorConfig.smoothing > 50 ? `all ${cursorConfig.smoothing}ms ease-out` : 'none',
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

{/* Canvas Elements Layer Component - renders elements either behind or above video */ }
function CanvasElementsLayer({
    canvasContainerRef,
    canvasElements,
    selectedElementId,
    hoveredElementId,
    isDraggingElement,
    behindVideo,
    onElementSelect,
    onElementUpdate,
    setHoveredElementId,
    setIsDraggingElement,
    setIsDraggingElementRotation,
    elementDragStart,
    layerZIndex,
}: {
    canvasContainerRef?: React.RefObject<HTMLDivElement | null>;
    canvasElements: CanvasElement[];
    selectedElementId: string | null;
    hoveredElementId: string | null;
    isDraggingElement: boolean;
    behindVideo: boolean;
    onElementSelect?: (id: string | null) => void;
    onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
    setHoveredElementId: (id: string | null) => void;
    setIsDraggingElement: (dragging: boolean) => void;
    setIsDraggingElementRotation: (dragging: boolean) => void;
    elementDragStart: React.MutableRefObject<{ x: number; y: number; initialX: number; initialY: number; initialRotation: number }>;
    layerZIndex: number;
}) {
    const layerRef = useRef<HTMLDivElement>(null);
    const [refSize, setRefSize] = useState(0);

    // Per-element corner tracking: elementId → Corner
    const [elementCorners, setElementCorners] = useState<Record<string, Corner>>({});

    useEffect(() => {
        const el = layerRef.current;
        if (!el) return;
        const measure = () => {
            const { width, height } = el.getBoundingClientRect();
            setRefSize(Math.min(width, height));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const toPx = (pct: number) => refSize > 0 ? (pct / 100) * refSize : 0;

    const setRefs = useCallback((node: HTMLDivElement | null) => {
        (layerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (canvasContainerRef) {
            const externalRef = canvasContainerRef as React.MutableRefObject<HTMLDivElement | null>;
            externalRef.current = node;
        }
    }, [canvasContainerRef]);

    const filteredElements = canvasElements.filter(element =>
        behindVideo ? element.zIndex < VIDEO_Z_INDEX : element.zIndex >= VIDEO_Z_INDEX
    );

    if (filteredElements.length === 0) {
        return (
            <div
                ref={setRefs}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: layerZIndex }}
            />
        );
    }

    return (
        <div
            ref={setRefs}
            className="absolute inset-0"
            onClick={(e) => {
                if (e.target === e.currentTarget && onElementSelect) onElementSelect(null);
            }}
            style={{ zIndex: layerZIndex, pointerEvents: 'none' }}
        >
            {[...filteredElements].sort((a, b) => a.zIndex - b.zIndex).map((element) => {
                const isSelected = selectedElementId === element.id;
                const isHovered = hoveredElementId === element.id;
                const activeCorner: Corner = elementCorners[element.id] ?? "top-right";

                const wPx = toPx(element.width);
                const hPx = toPx(element.height);

                const commonStyle: React.CSSProperties = {
                    position: "absolute",
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    width: wPx > 0 ? `${wPx}px` : `${element.width}%`,
                    height: hPx > 0 ? `${hPx}px` : `${element.height}%`,
                    transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                    zIndex: element.zIndex,
                    transition: isDraggingElement ? 'none' : 'transform 0.1s ease-out',
                };

                // ── Shared mouse handlers ──────────────────────────────────
                const handleMouseEnter = () => setHoveredElementId(element.id);
                const handleMouseLeave = () => setHoveredElementId(null);
                const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
                    // ✅ Pasar element.rotation para corregir el cálculo
                    const corner = getNearestCorner(e, element.rotation);
                    setElementCorners(prev => ({ ...prev, [element.id]: corner }));
                };
                const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
                    if (!onElementSelect) return;
                    if ((e.target as HTMLElement).closest('[data-element-rotation]')) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onElementSelect(element.id);
                    setIsDraggingElement(true);
                    elementDragStart.current = {
                        x: e.clientX,
                        y: e.clientY,
                        initialX: element.x,
                        initialY: element.y,
                        initialRotation: element.rotation,
                    };
                };

                // ── Rotation handle (shared across element types) ──────────
                const rotationHandle = isSelected && onElementUpdate ? (
                    <div
                        data-element-rotation
                        style={getCornerStyle(activeCorner, -14)}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingElementRotation(true);
                            elementDragStart.current = {
                                x: e.clientX,
                                y: e.clientY,
                                initialX: element.x,
                                initialY: element.y,
                                initialRotation: element.rotation,
                            };
                        }}
                    >
                        <RotationHandleIcon corner={activeCorner} />
                    </div>
                ) : null;

                // ── Selection / hover border ───────────────────────────────
                const selectionBorder = (isSelected || isHovered) ? (
                    <div
                        className={`absolute inset-0 border pointer-events-none ${isSelected ? 'border-blue-500' : 'border-white/50'}`}
                        style={{ borderRadius: '2px' }}
                    />
                ) : null;

                // ── Render by type ─────────────────────────────────────────
                if (element.type === "svg") {
                    const SvgComponent = SVG_COMPONENTS[(element as SvgElement).svgId];
                    return (
                        <div
                            key={element.id}
                            data-canvas-element
                            className="pointer-events-auto cursor-move"
                            style={commonStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}
                            onMouseDown={handleMouseDown}
                        >
                            {SvgComponent && (
                                <div className="w-full h-full" style={{ opacity: element.opacity }}>
                                    <SvgComponent color={(element as SvgElement).color} className="w-full h-full" />
                                </div>
                            )}
                            {selectionBorder}
                            {rotationHandle}
                        </div>
                    );
                }

                if (element.type === "image") {
                    return (
                        <div
                            key={element.id}
                            data-canvas-element
                            className="pointer-events-auto cursor-move"
                            style={commonStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}
                            onMouseDown={handleMouseDown}
                        >
                            <img
                                src={(element as ImageElement).imagePath}
                                alt="Image element"
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain rounded"
                                style={{ pointerEvents: 'none', opacity: element.opacity }}
                            />
                            {selectionBorder}
                            {rotationHandle}
                        </div>
                    );
                }

                if (element.type === "text") {
                    return (
                        <div
                            key={element.id}
                            data-canvas-element
                            className="absolute pointer-events-auto cursor-move select-none"
                            style={{
                                left: `${element.x}%`,
                                top: `${element.y}%`,
                                transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                                zIndex: element.zIndex,
                                transition: isDraggingElement ? 'none' : 'transform 0.1s ease-out',
                            }}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}
                            onMouseDown={handleMouseDown}
                        >
                            <div
                                className="whitespace-nowrap"
                                style={{
                                    fontSize: `${element.fontSize}px`,
                                    fontFamily: element.fontFamily,
                                    fontWeight: element.fontWeight === 'normal' ? 400 : element.fontWeight === 'medium' ? 500 : 700,
                                    textAlign: 'center',
                                    color: element.color,
                                    pointerEvents: 'none',
                                    opacity: element.opacity,
                                }}
                            >
                                {element.content}
                            </div>
                            {(isSelected || isHovered) && (
                                <div
                                    className={`absolute -inset-x-2 -inset-y-1 border pointer-events-none ${isSelected ? 'border-blue-500' : 'border-white/50'}`}
                                    style={{ borderRadius: '2px' }}
                                />
                            )}
                            {rotationHandle}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
