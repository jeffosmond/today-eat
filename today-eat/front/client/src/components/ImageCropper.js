import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropper.css';
export default function ImageCropper({ image, onCropComplete, onClose }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const onCropChange = (crop) => {
        setCrop(crop);
    };
    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };
    const onAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);
    const createImage = (url) => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });
    };
    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('无法创建 canvas 上下文');
        }
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        // 压缩图片至 20KB 以下
        return await compressCanvas(canvas);
    };
    const compressCanvas = async (canvas) => {
        const MAX_SIZE_KB = 20;
        let quality = 0.9;
        let blob;
        do {
            blob = await new Promise((resolve) => {
                canvas.toBlob((result) => resolve(result), 'image/jpeg', quality);
            });
            quality -= 0.1;
        } while (blob.size > MAX_SIZE_KB * 1024 && quality > 0.1);
        return blob;
    };
    const handleSave = async () => {
        if (!croppedAreaPixels)
            return;
        try {
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedBlob);
        }
        catch (error) {
            console.error('裁剪失败:', error);
            alert('裁剪失败，请重试');
        }
    };
    return (_jsx("div", { className: "image-cropper-overlay", onClick: onClose, children: _jsxs("div", { className: "image-cropper-container", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "cropper-header", children: [_jsx("h3", { children: "\u2702\uFE0F \u88C1\u526A\u56FE\u7247\u4E3A 1:1 \u6B63\u65B9\u5F62" }), _jsx("button", { className: "cropper-close", onClick: onClose, children: "\u2715" })] }), _jsx("div", { className: "cropper-body", children: _jsx(Cropper, { image: image, crop: crop, zoom: zoom, aspect: 1, onCropChange: onCropChange, onCropComplete: onAreaComplete, onZoomChange: onZoomChange, showGrid: true }) }), _jsxs("div", { className: "cropper-controls", children: [_jsxs("div", { className: "zoom-slider", children: [_jsx("label", { children: "\u7F29\u653E\uFF1A" }), _jsx("input", { type: "range", min: 1, max: 3, step: 0.1, value: zoom, onChange: (e) => onZoomChange(parseFloat(e.target.value)) })] }), _jsxs("div", { className: "cropper-actions", children: [_jsx("button", { className: "btn-cancel", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { className: "btn-save", onClick: handleSave, children: "\u2713 \u786E\u8BA4\u88C1\u526A" })] })] })] }) }));
}
