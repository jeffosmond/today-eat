import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import './ImageCropper.css';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export default function ImageCropper({ image, onCropComplete, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onAreaComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建 canvas 上下文');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // 压缩图片至 20KB 以下
    return await compressCanvas(canvas);
  };

  const compressCanvas = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    const MAX_SIZE_KB = 20;
    let quality = 0.9;
    let blob: Blob;

    do {
      blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (result) => resolve(result!),
          'image/jpeg',
          quality
        );
      });

      quality -= 0.1;
    } while (blob.size > MAX_SIZE_KB * 1024 && quality > 0.1);

    return blob;
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('裁剪失败:', error);
      alert('裁剪失败，请重试');
    }
  };

  return (
    <div className="image-cropper-overlay" onClick={onClose}>
      <div className="image-cropper-container" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>✂️ 裁剪图片为 1:1 正方形</h3>
          <button className="cropper-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="cropper-body">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onAreaComplete}
            onZoomChange={onZoomChange}
            showGrid={true}
          />
        </div>

        <div className="cropper-controls">
          <div className="zoom-slider">
            <label>缩放：</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="cropper-actions">
            <button className="btn-cancel" onClick={onClose}>取消</button>
            <button className="btn-save" onClick={handleSave}>✓ 确认裁剪</button>
          </div>
        </div>
      </div>
    </div>
  );
}
