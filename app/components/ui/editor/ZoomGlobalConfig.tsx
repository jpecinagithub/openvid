"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import type { ZoomFragment } from "@/types/zoom.types";
import { formatZoomTime, zoomLevelToFactor } from "@/types/zoom.types";

interface ZoomGlobalConfigProps {
    fragments: ZoomFragment[];
    onSelectFragment: (fragmentId: string) => void;
    onAddFragment: () => void;
}

export function ZoomGlobalConfig({
    fragments,
    onSelectFragment,
    onAddFragment,
}: ZoomGlobalConfigProps) {
    return (
        <div className="p-4 flex flex-col gap-6">
            <div className="flex items-center">
                <div className="flex items-center gap-2 text-white font-medium">
                    <Icon icon="iconamoon:zoom-in-bold" width="20" />
                    <span>Zoom</span>
                </div>
            </div>

            {/* Fragment list */}
            {fragments.length > 0 && (
                <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                        Fragmentos ({fragments.length})
                    </div>
                    <div className="space-y-1.5">
                        {fragments.map((fragment, index) => (
                            <button
                                key={fragment.id}
                                onClick={() => onSelectFragment(fragment.id)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-[#09090B] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                            >
                                <div className="size-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                                    <Icon icon="iconamoon:zoom-in-bold" width="14" className="text-blue-400" />
                                </div>
                                <div className="flex flex-col items-start flex-1 min-w-0">
                                    <span className="text-xs text-white/80 font-medium">Zoom {index + 1}</span>
                                    <span className="text-[10px] text-white/40 font-mono">
                                        {formatZoomTime(fragment.startTime)} - {formatZoomTime(fragment.endTime)}
                                    </span>
                                </div>
                                <div className="text-[10px] text-white/30 font-mono">
                                    {zoomLevelToFactor(fragment.zoomLevel).toFixed(1)}×
                                </div>
                                <Icon icon="ph:caret-right" width="14" className="text-white/20 group-hover:text-white/40" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Button
                variant="outline"
                className="w-full text-xs"
                onClick={onAddFragment}
            >
                <Icon icon="ph:plus-bold" width="14" />
                Añadir fragmento
            </Button>

            {/* Keyboard shortcuts tip */}
            <div className="text-[10px] text-white/50 space-y-1 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-mono">Delete</kbd>
                    <span>Eliminar fragmento seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-mono">Esc</kbd>
                    <span>Deseleccionar fragmento</span>
                </div>
                <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-mono">Click en track</kbd>
                    <span>Añadir fragmento en posición</span>
                </div>
            </div>
        </div>
    );
}
