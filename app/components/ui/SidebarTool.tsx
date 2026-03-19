"use client";

import { Icon } from "@iconify/react";
import { ReactNode } from "react";

interface SidebarToolProps {
    icon: string | ReactNode;
    label?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export function SidebarTool({ icon, label, isActive, onClick }: SidebarToolProps) {
    return (
        <button
            onClick={onClick}
            className={`relative flex flex-col items-center gap-1.5 transition-all duration-200 group w-full ${isActive ? "text-white" : "text-white/60 hover:text-white"
                }`}
        >
            {isActive && (
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent mx-2" />
            )}

            <span
                className="flex items-center justify-center p-3 squircle-element transition-all duration-200 group relative"
                style={isActive ? {
                    background: 'radial-gradient(circle at 50% 0%, #555555 0%, #454545 64%)',
                    boxShadow: 'inset 0 1.01rem 0.2rem -1rem #fff, 0 0 0 1px #fff4, 0 4px 4px 0 #0004, 0 0 0 1px #333',
                } : {}}
            >
                <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                    {typeof icon === "string" ? (
                        <Icon icon={icon} width="20" />
                    ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>

                {isActive && (
                    <div className="absolute left-1 w-8 h-2 top-1/5 -translate-y-1/2 size-3 bg-white rounded-full blur-[5px] rotate-45 opacity-50" />
                )}
            </span>

            {label && (
                <label className="text-xs font-medium cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                    {label}
                </label>
            )}
        </button>
    );
}