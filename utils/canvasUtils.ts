
import { Lens, StyleState } from '../types';
import { hexToRgba } from './colorUtils';

export async function generateCanvas(
  imageSource: HTMLImageElement,
  lenses: Lens[],
  style: StyleState,
  renderedWidth?: number
): Promise<HTMLCanvasElement> {
  // Ensure we are working with a CORS-ready image if possible for export
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSource.src;

  try {
      await new Promise((resolve, reject) => {
          if (image.complete && image.naturalWidth > 0) {
               resolve(true);
               return;
          }
          image.onload = () => resolve(true);
          image.onerror = () => {
              // Failed to load with CORS. Do NOT fallback to non-CORS (crossOrigin=null)
              // as this taints the canvas and prevents export.
              reject(new Error('CORS_ERROR: Image could not be loaded with CORS headers.'));
          };
      });
  } catch (e) {
       console.error("Image load failed due to CORS or network error", e);
       throw new Error('CORS_ERROR');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Calculate geometry & WYSIWYG Scale Factor
  const imgW = image.naturalWidth;
  const imgH = image.naturalHeight;
  const scale = (renderedWidth && renderedWidth > 0) ? (imgW / renderedWidth) : 1;
  const scaledCanvasBorderWidth = style.canvasBorderWidth * scale;

  // CROP DIMENSIONS
  const cropW = imgW * (style.cropWidth / 100);
  const cropH = imgH * (style.cropHeight / 100);

  // Calculate canvas bounds based on ALL lenses and shadows
  let minCanvasLeft = 0, minCanvasTop = 0, maxCanvasRight = cropW, maxCanvasBottom = cropH;

  lenses.forEach(lens => {
      const scaledLensSize = lens.size * scale;
      const lensCX_crop = lens.x * cropW;
      const lensCY_crop = lens.y * cropH;
      const lensRadius = scaledLensSize / 2;

      const scaledBorderWidth = lens.borderWidth * scale;
      const scaledShadowBlur = lens.shadowBlur * scale;
      const scaledShadowSpread = lens.shadowSpread * scale;
      const scaledShadowX = lens.shadowX * scale;
      const scaledShadowY = lens.shadowY * scale;

      const lensShadowExtent = lens.shadowOpacity > 0 
          ? scaledShadowBlur + scaledShadowSpread + Math.max(Math.abs(scaledShadowX), Math.abs(scaledShadowY))
          : 0;
      const lensBorderExtent = scaledBorderWidth / 2;
      const lensTotalRadius = lensRadius + Math.max(lensShadowExtent, lensBorderExtent);

      minCanvasLeft = Math.min(minCanvasLeft, lensCX_crop - lensTotalRadius);
      minCanvasTop = Math.min(minCanvasTop, lensCY_crop - lensTotalRadius);
      maxCanvasRight = Math.max(maxCanvasRight, lensCX_crop + lensTotalRadius);
      maxCanvasBottom = Math.max(maxCanvasBottom, lensCY_crop + lensTotalRadius);
  });

  if (style.canvasShadowEnabled) {
      const canvasShadowBlur = style.canvasShadowBlur * scale;
      const canvasShadowSpread = style.canvasShadowSpread * scale;
      const canvasShadowX = style.canvasShadowX * scale;
      const canvasShadowY = style.canvasShadowY * scale;
      // Include spread in buffer calculation
      const shadowBuffer = canvasShadowBlur * 1.5 + canvasShadowSpread; 
      
      minCanvasLeft = Math.min(minCanvasLeft, Math.min(0, canvasShadowX - shadowBuffer));
      minCanvasTop = Math.min(minCanvasTop, Math.min(0, canvasShadowY - shadowBuffer));
      maxCanvasRight = Math.max(maxCanvasRight, Math.max(cropW, cropW + canvasShadowX + shadowBuffer));
      maxCanvasBottom = Math.max(maxCanvasBottom, Math.max(cropH, cropH + canvasShadowY + shadowBuffer));
  }

  canvas.width = maxCanvasRight - minCanvasLeft;
  canvas.height = maxCanvasBottom - minCanvasTop;

  const offsetX = -minCanvasLeft;
  const offsetY = -minCanvasTop;

  // 2. Draw Background
  if (!style.isBackgroundTransparent) {
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 3. Draw Canvas Drop Shadow (incorporating Spread by adjusting rect size)
  if (style.canvasShadowEnabled) {
      const scaledCropRadius = style.cropRadius * scale;
      const spread = style.canvasShadowSpread * scale;
      ctx.save();
      ctx.beginPath();
      // Adjust rect by spread (outwards if positive, inwards if negative)
      ctx.roundRect(
          offsetX - spread, 
          offsetY - spread, 
          cropW + (spread * 2), 
          cropH + (spread * 2), 
          Math.max(0, scaledCropRadius + spread) // Adjust radius to match spread
      );
      ctx.shadowColor = hexToRgba(style.canvasShadowColor, style.canvasShadowOpacity);
      ctx.shadowBlur = style.canvasShadowBlur * scale;
      ctx.shadowOffsetX = style.canvasShadowX * scale;
      ctx.shadowOffsetY = style.canvasShadowY * scale;
      ctx.fillStyle = '#000000'; 
      ctx.fill();
      ctx.restore();
  }

  // 4. Draw CROPPED Base Image
  const scaledCropRadius = style.cropRadius * scale;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(offsetX, offsetY, cropW, cropH, scaledCropRadius);
  ctx.clip();

  ctx.filter = `blur(${style.baseBlur * scale}px) grayscale(${style.baseGrayscale}%)`;
  ctx.globalAlpha = style.baseOpacity / 100;

  const scaledImgW = imgW * style.cropZoom;
  const scaledImgH = imgH * style.cropZoom;
  const imgDrawX = offsetX + (cropW - scaledImgW) * (style.cropX / 100);
  const imgDrawY = offsetY + (cropH - scaledImgH) * (style.cropY / 100);

  try {
      ctx.drawImage(image, imgDrawX, imgDrawY, scaledImgW, scaledImgH);
  } catch(e) {
       // Catching specifically drawImage CORS errors if they somehow slip through
       throw new Error('CORS_ERROR');
  }
  ctx.restore();

  // 4b. Scrim
  if (style.scrimOpacity > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(offsetX, offsetY, cropW, cropH, scaledCropRadius);
      ctx.clip();
      ctx.fillStyle = style.scrimColor;
      ctx.globalAlpha = style.scrimOpacity / 100;
      ctx.fillRect(offsetX, offsetY, cropW, cropH);
      ctx.restore();
  }

  // 4c. Canvas Border
  if (scaledCanvasBorderWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(offsetX, offsetY, cropW, cropH, scaledCropRadius);
      ctx.clip();
      ctx.lineWidth = scaledCanvasBorderWidth * 2;
      ctx.strokeStyle = style.canvasBorderColor;
      ctx.stroke();
      ctx.restore();
  }

  // Lenses
  lenses.forEach(lens => {
      const scaledLensSize = lens.size * scale;
      const lensRadius = scaledLensSize / 2;
      const lensCX_crop = lens.x * cropW;
      const lensCY_crop = lens.y * cropH;
      const cx = lensCX_crop + offsetX;
      const cy = lensCY_crop + offsetY;

      const scaledBorderWidth = lens.borderWidth * scale;
      const scaledShadowBlur = lens.shadowBlur * scale;
      const scaledShadowSpread = lens.shadowSpread * scale;
      const scaledShadowX = lens.shadowX * scale;
      const scaledShadowY = lens.shadowY * scale;

      // 6. Draw Lens Shadow (incorporating spread by adjusting circle radius)
      ctx.save();
      ctx.beginPath();
      // The shadow casting circle is larger/smaller by the spread amount
      ctx.arc(cx, cy, Math.max(0, lensRadius + scaledShadowSpread), 0, Math.PI * 2);

      if (lens.shadowOpacity > 0) {
          ctx.shadowColor = hexToRgba(lens.shadowColor, lens.shadowOpacity);
          ctx.shadowBlur = scaledShadowBlur;
          ctx.shadowOffsetX = scaledShadowX;
          ctx.shadowOffsetY = scaledShadowY;
          // We use a fill to cast the shadow. 
          // The actual lens content drawn next will cover this black circle.
          ctx.fillStyle = '#000000';
          ctx.fill();
      }
      ctx.restore();

      // 7. Draw Zoomed Image
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, lensRadius, 0, Math.PI * 2);
      ctx.clip();

      if (!style.isBackgroundTransparent) {
          ctx.fillStyle = style.backgroundColor;
          ctx.fill();
      }

      const imgDrawX_rel_crop = (cropW - scaledImgW) * (style.cropX / 100);
      const imgDrawY_rel_crop = (cropH - scaledImgH) * (style.cropY / 100);
      const lensCenterX_rel_scaledImg = lensCX_crop - imgDrawX_rel_crop;
      const lensCenterY_rel_scaledImg = lensCY_crop - imgDrawY_rel_crop;
      const lensCenterX_origImg = lensCenterX_rel_scaledImg / style.cropZoom;
      const lensCenterY_origImg = lensCenterY_rel_scaledImg / style.cropZoom;
      const zoomedWidth = imgW * lens.zoom;
      const zoomedHeight = imgH * lens.zoom;
      const drawX = cx - (lensCenterX_origImg * lens.zoom);
      const drawY = cy - (lensCenterY_origImg * lens.zoom);

      if (scaledCropRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(drawX, drawY, zoomedWidth, zoomedHeight, scaledCropRadius * lens.zoom);
          ctx.clip();
      }

      ctx.drawImage(image, drawX, drawY, zoomedWidth, zoomedHeight);
      ctx.restore();

      // 8. Border
      if (scaledBorderWidth > 0) {
          ctx.save();
          ctx.beginPath();
          const borderInset = scaledBorderWidth / 2;
          ctx.arc(cx, cy, Math.max(0, lensRadius - borderInset), 0, Math.PI * 2);
          ctx.lineWidth = scaledBorderWidth;
          ctx.strokeStyle = lens.borderColor;
          ctx.stroke();
          ctx.restore();
      }
  });

  return canvas;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
          if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
          }
          try {
              const data = [new ClipboardItem({ [blob.type]: blob })];
              await navigator.clipboard.write(data);
              resolve();
          } catch (err) {
              reject(err);
          }
      }, 'image/png');
  });
}
