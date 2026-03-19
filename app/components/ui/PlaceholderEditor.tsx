import { Icon } from "@iconify/react";
import { useRef } from "react";

interface PlaceholderEditorProps {
    onVideoUpload?: (file: File) => void;
    isUploading?: boolean;
}

export default function PlaceholderEditor({ onVideoUpload, isUploading = false }: PlaceholderEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onVideoUpload) {
            onVideoUpload(file);
            // Reset input para permitir subir el mismo archivo nuevamente
            e.target.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    return (
       <>
        <div className="bg-[#2D2D2D] flex flex-col justify-center items-center px-6 shrink-0 w-3xl h-16 rounded-t-2xl border-b border-white/5">
            <div className="flex items-center w-full gap-4">
                <div className="flex gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-4 h-4 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-4 h-4 rounded-full bg-[#27C93F]"></div>
                </div>

                <div className="flex-1 max-w-xl mx-auto bg-[#1C1C1C] py-3 rounded-xl border border-white/10 flex items-center justify-center">
                    <span className="text-sm tracking-wide text-gray-400 font-medium">
                    https://freeshotshot.dev
                    </span>
                </div>

                <div className="w-20"></div>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-[#121212]/50 p-12">
            <div className="text-center text-neutral-500 max-w-lg">
                <Icon icon="mdi:video-off-outline" className="text-8xl mb-6 mx-auto opacity-20" />
                <h3 className="text-2xl font-semibold mb-2 text-neutral-300">No hay video cargado</h3>
                <p className="text-lg opacity-60 mb-8">
                    Para empezar a editar, graba tu pantalla desde la página principal o sube un video.
                </p>
                
                {onVideoUpload && (
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="inline-flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isUploading ? (
                            <>
                                <Icon icon="svg-spinners:ring-resize" width="24" height="24" />
                                <span>Subiendo video...</span>
                            </>
                        ) : (
                            <>
                                <Icon icon="mage:video-upload" width="24" height="24" />
                                <span>Subir Video</span>
                            </>
                        )}
                    </button>
                )}
                
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska" 
                    className="hidden" 
                    onChange={handleFileChange}
                />
            </div>
        </div>
    </>
    );
}