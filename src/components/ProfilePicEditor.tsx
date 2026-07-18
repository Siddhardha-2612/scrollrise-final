import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { ArrowLeft } from 'lucide-react';
import 'react-easy-crop/react-easy-crop.css';

interface ProfilePicEditorProps {
  image: string;
  onCancel: () => void;
  onApply: (croppedImage: string) => void;
}

export default function ProfilePicEditor({ image, onCancel, onApply }: ProfilePicEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');

    // Cap size for Firestore optimization (max 320px)
    const maxSize = 320;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > maxSize) {
      const ratio = maxSize / targetWidth;
      targetWidth = maxSize;
      targetHeight = targetHeight * ratio;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Use lower quality for JPEG to keep string length short
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const handleApply = async () => {
    if (croppedAreaPixels) {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onApply(croppedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <header className="flex items-center p-3 z-[100] bg-black h-16 justify-between">
        <button onClick={onCancel} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
          <button onClick={handleApply} className="text-white font-bold text-lg bg-blue-600 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-all">Apply</button>
        </div>
      </header>
      <div className="relative flex-grow">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
    </div>
  );
}
