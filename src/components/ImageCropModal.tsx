import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Crop, ZoomIn, ZoomOut, Check, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toPersianDigits } from '../utils/persian';

export type AspectRatioType = '1:1' | '3:4' | '16:9' | '4:3' | 'free';

interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  sublabel: string;
  ratio: number | null; // width / height
  targetWidth: number;
  targetHeight: number;
}

const ASPECT_OPTIONS: AspectRatioOption[] = [
  { id: '1:1', label: '۱:۱ (مربع ویژه)', sublabel: 'با پس‌زمینه محو خودکار', ratio: 1, targetWidth: 600, targetHeight: 600 },
  { id: '3:4', label: '۳:۴ (جلد کتاب)', sublabel: 'طرح استاندارد عمودی', ratio: 3 / 4, targetWidth: 600, targetHeight: 800 },
  { id: '16:9', label: '۱۶:۹ (عریض)', sublabel: 'بنر و پوستر مسابقات', ratio: 16 / 9, targetWidth: 800, targetHeight: 450 },
  { id: '4:3', label: '۴:۳ (استاندارد)', sublabel: 'کادر متوسط نمایش', ratio: 4 / 3, targetWidth: 800, targetHeight: 600 },
  { id: 'free', label: 'اندازه کامل (آزاد)', sublabel: 'بدون تغییر نسبت', ratio: null, targetWidth: 800, targetHeight: 800 },
];

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  initialAspect?: AspectRatioType;
  title?: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  initialAspect = '1:1',
  title = 'تنظیم و برش تصویر',
  onConfirm,
  onCancel,
}) => {
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioType>(initialAspect);
  const [blurPadding, setBlurPadding] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset controls when image changes
  useEffect(() => {
    if (isOpen) {
      setSelectedAspect(initialAspect);
      setBlurPadding(true);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    }
  }, [isOpen, initialAspect, imageSrc]);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      renderPreview();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.width || !img.height) return;

    const currentOpt = ASPECT_OPTIONS.find((o) => o.id === selectedAspect) || ASPECT_OPTIONS[0];
    let canvasW = currentOpt.targetWidth;
    let canvasH = currentOpt.targetHeight;

    if (selectedAspect === 'free' || !currentOpt.ratio) {
      const maxDim = 800;
      const aspect = img.width / img.height;
      if (aspect >= 1) {
        canvasW = Math.min(img.width, maxDim);
        canvasH = Math.round(canvasW / aspect);
      } else {
        canvasH = Math.min(img.height, maxDim);
        canvasW = Math.round(canvasH * aspect);
      }
    }

    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Draw blurred background if blurPadding is enabled
    if (blurPadding && selectedAspect !== 'free') {
      ctx.save();
      // Draw zoomed/stretched blurred background
      ctx.filter = 'blur(22px) brightness(0.7)';
      // Scale cover
      const bgScale = Math.max(canvasW / img.width, canvasH / img.height) * 1.15;
      const bgW = img.width * bgScale;
      const bgH = img.height * bgScale;
      const bgX = (canvasW - bgW) / 2;
      const bgY = (canvasH - bgH) / 2;
      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.restore();

      // Semi-dark overlay for better contrast
      ctx.fillStyle = 'rgba(4, 47, 46, 0.4)';
      ctx.fillRect(0, 0, canvasW, canvasH);
    } else {
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // 2. Draw centered foreground image
    ctx.save();

    // Calculate containment
    let baseScale = 1;
    if (selectedAspect === 'free') {
      baseScale = Math.min(canvasW / img.width, canvasH / img.height);
    } else if (blurPadding) {
      // Contain mode
      baseScale = Math.min((canvasW * 0.92) / img.width, (canvasH * 0.92) / img.height);
    } else {
      // Cover mode if no blur padding
      baseScale = Math.max(canvasW / img.width, canvasH / img.height);
    }

    const scale = baseScale * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    const drawX = (canvasW - drawW) / 2 + offsetX;
    const drawY = (canvasH - drawH) / 2 + offsetY;

    if (blurPadding && selectedAspect !== 'free') {
      // Add shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }, [selectedAspect, blurPadding, zoom, offsetX, offsetY]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Mouse / Touch Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onConfirm(dataUrl);
    } catch {
      // fallback
      if (imageSrc) onConfirm(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#042f2e] border-2 border-[#84cc16]/60 rounded-3xl p-5 sm:p-7 shadow-2xl text-right my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0d9488]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#84cc16] text-[#042f2e] flex items-center justify-center shadow-md">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">{title}</h3>
              <p className="text-[11px] text-[#99f6e4]">
                برش در ابعاد استاندارد سایت یا تنظیم خودکار ۱ در ۱ با حاشیه محو
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-[#073834] text-stone-400 hover:text-white border border-[#0d9488]/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Options */}
        <div className="py-4 border-b border-[#0d9488]/20 shrink-0">
          <span className="block text-xs font-bold text-[#84cc16] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>انتخاب نسبت ابعاد:</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ASPECT_OPTIONS.map((opt) => {
              const isSelected = selectedAspect === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedAspect(opt.id);
                    setZoom(1);
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                  className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#84cc16] text-[#042f2e] border-[#84cc16] shadow-lg font-black'
                      : 'bg-[#073834]/80 text-[#ccfbf1] border-[#0d9488]/40 hover:bg-[#0d9488]/20'
                  }`}
                >
                  <strong className="block text-xs">{opt.label}</strong>
                  <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-[#042f2e]/80' : 'text-[#99f6e4]/70'}`}>
                    {opt.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Canvas Preview Area */}
        <div className="flex-1 min-h-[260px] max-h-[420px] my-3 rounded-2xl bg-[#021d1c] border border-[#0d9488]/40 flex items-center justify-center p-3 relative overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-h-full max-w-full rounded-xl shadow-2xl cursor-grab active:cursor-grabbing border border-[#84cc16]/40"
          />
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-[#042f2e]/85 border border-[#0d9488]/40 text-[10px] text-[#99f6e4] pointer-events-none">
            می‌توانید تصویر را برای تنظیم موقعیت بکشید (Drag)
          </div>
        </div>

        {/* Controls: Zoom & Blur Margin Toggle */}
        <div className="p-3 rounded-2xl bg-[#073834]/80 border border-[#0d9488]/30 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <ZoomOut className="w-4 h-4 text-[#99f6e4] shrink-0" />
            <input
              type="range"
              min={0.7}
              max={2.5}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[#84cc16] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-[#99f6e4] shrink-0" />
            <span className="text-[11px] font-mono text-white w-10 text-center">
              {toPersianDigits(Math.round(zoom * 100))}%
            </span>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffsetX(0);
                setOffsetY(0);
              }}
              className="p-1 rounded-lg bg-[#042f2e] text-[#99f6e4] hover:text-white border border-[#0d9488]/30"
              title="بازنشانی"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Blur Padding Checkbox */}
          {selectedAspect !== 'free' && (
            <label className="flex items-center gap-2 text-white font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={blurPadding}
                onChange={(e) => setBlurPadding(e.target.checked)}
                className="w-4 h-4 accent-[#84cc16] rounded"
              />
              <span className="text-xs">پر کردن حاشیه‌ها با حالت محو خودکار</span>
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#0d9488]/30 mt-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-[#073834] text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'در حال اعمال برش...' : 'تأیید و ذخیره تصویر'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
