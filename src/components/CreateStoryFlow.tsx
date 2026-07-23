import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  ChevronDown,
  Play,
  Pause,
  LayoutTemplate,
  Layers,
  Sparkles,
  Send,
  ChevronRight,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";

interface Story {
  id: string;
  mediaUri: string;
  mediaType: "image" | "video";
  timestamp: string;
  duration: number;
  caption?: string;
  isCloseFriends?: boolean;
  musicTitle?: string;
  musicArtist?: string;
  musicAlbumArt?: string;
  calligraphyCaptions?: any[];
}

export interface GalleryMediaItem {
  id: string;
  folder?: string;
  type: "image" | "video";
  uri: string;
  aspectRatio: string;
  duration?: number;
}

interface CreateStoryFlowProps {
  onClose: () => void;
  onPost: (
    storySegments: any,
    options?: { destination?: "flash" | "snaps_scrolls" | "snaps_scrolls_all" },
  ) => void;
  galleryItems: GalleryMediaItem[];
  triggerToast: (msg: string) => void;
}

export default function CreateStoryFlow({
  onClose,
  onPost,
  galleryItems,
  triggerToast,
}: CreateStoryFlowProps) {
  const [step, setStep] = useState<"gallery" | "preview">("gallery");
  const [selectedMediaUris, setSelectedMediaUris] = useState<string[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Calligraphy Caption State
  const CALLIGRAPHY_FONTS = [
    "font-sans text-white drop-shadow-md",
    "font-serif text-white italic drop-shadow-md",
    "font-mono text-white drop-shadow-md",
    "font-sans font-bold text-white uppercase tracking-widest drop-shadow-md",
    "font-serif font-bold text-black bg-white px-3 py-1 rounded",
    "font-mono font-bold text-white bg-black px-3 py-1 rounded",
    "font-sans text-white border-2 border-white px-3 py-1",
    "font-serif text-white opacity-90 decoration-white underline underline-offset-4",
    "font-sans font-black text-transparent bg-clip-text bg-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]",
    "font-sans font-bold italic text-black bg-white px-4 py-2 rounded-full",
  ];
  const [captionInput, setCaptionInput] = useState("");
  const [calligraphyIndex, setCalligraphyIndex] = useState(0);
  const [captionOffset, setCaptionOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const captionDragStart = React.useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const handleCaptionPointerDown = (e: React.PointerEvent) => {
    setIsDraggingCaption(true);
    captionDragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: captionOffset.x,
      offsetY: captionOffset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCaptionPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCaption) return;
    setCaptionOffset({
      x:
        captionDragStart.current.offsetX +
        (e.clientX - captionDragStart.current.x),
      y:
        captionDragStart.current.offsetY +
        (e.clientY - captionDragStart.current.y),
    });
  };

  const handleCaptionPointerUp = (e: React.PointerEvent) => {
    setIsDraggingCaption(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isCloseFriends, setIsCloseFriends] = useState<boolean>(false);

  const [nativeFileTypes, setNativeFileTypes] = useState<
    Record<string, "image" | "video">
  >({});

  // Re-define handling for native file picking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];

      const fileReaders = files.map((file) => {
        return new Promise<{ uri: string; type: "image" | "video" }>(
          (resolve) => {
            let objectUrl = "";
            try {
              objectUrl = URL.createObjectURL(file);
            } catch (e) {
              objectUrl =
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=100&w=1200"; // fallback
            }
            const isVideoFile =
              file.type.startsWith("video/") ||
              file.name.match(/\.(mp4|mov|webm|ogg)$/i);
            resolve({
              uri: objectUrl,
              type: isVideoFile ? "video" : "image",
            });
          },
        );
      });

      Promise.all(fileReaders).then((results) => {
        const uris = results.map((r) => r.uri);
        const types = results.reduce(
          (acc, curr) => {
            acc[curr.uri] = curr.type;
            return acc;
          },
          {} as Record<string, "image" | "video">,
        );

        setNativeFileTypes((prev) => ({ ...prev, ...types }));
        setSelectedMediaUris(uris);
        setStep("preview");
      });
    }
  };

  const handlePostStory = (
    destination: "flash" | "snaps_scrolls" | "snaps_scrolls_all" = "flash",
  ) => {
    if (selectedMediaUris.length === 0) return;

    // Convert current custom caption to a CalligraphyCaption object for compatibility with StoriesView rendering
    const customCalligraphies = captionInput.trim()
      ? [
          {
            id: `caption_${Date.now()}`,
            text: captionInput,
            styleId: CALLIGRAPHY_FONTS[calligraphyIndex],
            color: "#ffffff",
            x: captionOffset.x,
            y: captionOffset.y,
            rotation: 0,
            scale: 1,
            createdAt: Date.now(),
          },
        ]
      : undefined;

    const newStorySegments = selectedMediaUris.map((uri, idx) => {
      // Try to find if it's a video or image
      const galleryItem = galleryItems.find((item) => item.uri === uri);
      const computedType =
        nativeFileTypes[uri] ||
        galleryItem?.type ||
        (uri.includes("data:video") ||
        uri.includes(".mp4") ||
        uri.includes(".webm")
          ? "video"
          : "image");
      return {
        id: `story_edit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${idx}`,
        mediaUri: uri,
        mediaType: computedType,
        timestamp: "Just now",
        duration: galleryItem?.duration || 5, // Custom videos might need their own duration detection, but 5s is fine for simple preview defaults if we don't load metadata.
        isCloseFriends: isCloseFriends,
        caption: captionInput,
        calligraphyCaptions: customCalligraphies,
      };
    });

    onPost(newStorySegments, { destination });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black text-white flex flex-col items-stretch overflow-hidden font-sans">
      {step === "gallery" && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-4 pt-16 pb-4 shrink-0 bg-black">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-neutral-900 active:scale-95 transition-all text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
              <span className="text-[20px] font-bold text-white tracking-wide leading-none font-sans">
                Gallery
              </span>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Native Gallery Trigger */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-xl pointer-events-none">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-wide">
              Select Media
            </h2>
            <p className="text-sm text-neutral-500 mb-8 max-w-[200px] leading-relaxed">
              Choose photos or videos from your device to share.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-black px-8 py-3 rounded-2xl font-bold tracking-wide active:scale-95 transition-all w-full max-w-[250px] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Open Gallery
            </button>
          </div>
        </div>
      )}

      {step === "preview" && selectedMediaUris.length > 0 && (
        <div className="flex-1 flex flex-col h-full bg-[#1A1A1A] relative">
          {/* Top Actions overlay */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-16 pb-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => setStep("gallery")}
              className="p-2 -ml-2 rounded-full hover:bg-black/20 text-white transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
            {selectedMediaUris.length > 1 && (
              <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                {currentMediaIndex + 1} / {selectedMediaUris.length}
              </div>
            )}
            <button
              onClick={() => {
                const newUris = [...selectedMediaUris];
                newUris.splice(currentMediaIndex, 1);
                setSelectedMediaUris(newUris);
                if (newUris.length === 0) {
                  setStep("gallery");
                } else if (currentMediaIndex >= newUris.length) {
                  setCurrentMediaIndex(newUris.length - 1);
                }
              }}
              className="p-2 -mr-2 rounded-full bg-black/20 hover:bg-black/20 text-white transition-all active:scale-90"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Full-screen Media */}
          <div 
            className="flex-1 relative w-full overflow-hidden bg-black rounded-b-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            onClick={() => {
              if (selectedMediaUris.length > 1) {
                setCurrentMediaIndex((prev) => (prev + 1) % selectedMediaUris.length);
              }
            }}
          >
            {selectedMediaUris[currentMediaIndex]?.includes("video") ||
            nativeFileTypes[selectedMediaUris[currentMediaIndex]] === "video" ? (
              <video
                key={selectedMediaUris[currentMediaIndex]}
                src={selectedMediaUris[currentMediaIndex]}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                key={selectedMediaUris[currentMediaIndex]}
                src={selectedMediaUris[currentMediaIndex]}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}

            {/* DRAGGABLE CAPTION OVERLAY */}
            {captionInput && (
              <div
                onPointerDown={handleCaptionPointerDown}
                onPointerMove={handleCaptionPointerMove}
                onPointerUp={handleCaptionPointerUp}
                onPointerCancel={handleCaptionPointerUp}
                className="absolute left-1/2 top-1/2 touch-none z-30 flex items-center justify-center p-4 min-w-[100px] text-center"
                style={{
                  transform: `translate(calc(-50% + ${captionOffset.x}px), calc(-50% + ${captionOffset.y}px))`,
                  cursor: isDraggingCaption ? "grabbing" : "grab",
                }}
              >
                <span
                  className={`text-4xl min-w-max select-none block max-w-[300px] break-words whitespace-normal leading-tight transition-colors duration-200 ${CALLIGRAPHY_FONTS[calligraphyIndex]}`}
                >
                  {captionInput}
                </span>
              </div>
            )}
          </div>

          {/* Caption and Share Bar floating over media */}
          <div className="absolute bottom-6 inset-x-0 px-4 z-40 flex items-center justify-between space-x-3 pointer-events-auto w-full max-w-md mx-auto">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-zinc-950/80 border border-white/10 text-sm rounded-[20px] py-3 pl-5 pr-16 focus:outline-none focus:border-[#0091FF]/50 placeholder-white/50 text-white font-sans tracking-wide shadow-xl backdrop-blur-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCalligraphyIndex(
                    (prev) => (prev + 1) % CALLIGRAPHY_FONTS.length,
                  );
                }}
                className={`absolute right-4 flex items-center justify-center font-serif text-sm font-bold italic text-white/70 hover:text-white transition-colors p-1`}
                title="Format text"
              >
                Aa
              </button>
            </div>
            
            <button
              className="w-12 h-12 bg-white hover:opacity-90 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-xl"
              onClick={() => handlePostStory()}
            >
              <ChevronRight className="w-6 h-6 text-black stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
