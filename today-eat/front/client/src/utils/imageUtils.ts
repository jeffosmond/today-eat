/**
 * 图片处理工具 - 裁剪为 1:1 并压缩至 20KB 以下
 */

const MAX_SIZE_KB = 20;
const TARGET_SIZE = 300; // 裁剪后尺寸

/**
 * 将图片裁剪为 1:1 正方形并压缩
 */
export async function cropAndCompressImage(
  file: File,
  crop: { x: number; y: number; width: number }
): Promise<Blob> {
  // 创建 Image 对象
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageUrl;
  });
  
  // 计算裁剪区域（1:1 正方形）
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建 canvas 上下文');
  }
  
  // 设置 canvas 尺寸为正方形
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  
  // 计算源图片的裁剪区域
  const sourceSize = Math.min(crop.width, image.height - (crop.y / image.width * crop.width));
  const sourceX = (crop.x / image.width) * image.naturalWidth;
  const sourceY = (crop.y / image.height) * image.naturalHeight;
  const sourceSizeX = (sourceSize / image.width) * image.naturalWidth;
  const sourceSizeY = (sourceSize / image.height) * image.naturalHeight;
  
  // 绘制裁剪后的图片
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSizeX,
    sourceSizeY,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE
  );
  
  URL.revokeObjectURL(imageUrl);
  
  // 压缩图片
  return await compressCanvas(canvas, file.type);
}

/**
 * 压缩 Canvas 图片至指定大小
 */
async function compressCanvas(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  let quality = 0.9;
  let blob: Blob;
  
  do {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (result) => resolve(result!),
        mimeType,
        quality
      );
    });
    
    quality -= 0.1;
  } while (blob.size > MAX_SIZE_KB * 1024 && quality > 0.1);
  
  return blob;
}

/**
 * 简单压缩图片（不裁剪）
 */
export async function compressImage(file: File, maxWidth: number = 800): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageUrl;
  });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建 canvas 上下文');
  }
  
  // 计算缩放比例
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = height * ratio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.drawImage(image, 0, 0, width, height);
  
  URL.revokeObjectURL(imageUrl);
  
  return await compressCanvas(canvas, file.type);
}

/**
 * 将 Blob 转换为 File
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
