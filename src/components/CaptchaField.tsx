import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { toEnglishDigits } from '../utils/persian';

interface CaptchaFieldProps {
  value: string;
  onChange: (val: string) => void;
  captchaCode: string;
  onRefresh: () => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export const generateRandomCaptcha = (length: number = 5): string => {
  // 5-digit numeric string (avoiding leading zero for user clarity: 10000 - 99999)
  const num = Math.floor(10000 + Math.random() * 90000);
  return num.toString();
};

export const CaptchaField: React.FC<CaptchaFieldProps> = ({
  value,
  onChange,
  captchaCode,
  onRefresh,
  placeholder = 'کد امنیتی ۵ رقمی',
  id = 'captcha-input',
  required = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captchaCode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.5, '#073834');
    grad.addColorStop(1, '#042f2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 10; x < width; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 8; y < height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Random wavy security lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#0d9488', '#84cc16', '#2dd4bf'][i % 3];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 15, Math.random() * height);
      ctx.bezierCurveTo(
        width * 0.3, Math.random() * height,
        width * 0.7, Math.random() * height,
        width - Math.random() * 15, Math.random() * height
      );
      ctx.stroke();
    }

    // Random security dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#84cc16' : '#5eead4';
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with distinct colors & slight rotation
    const colors = ['#a3e635', '#5eead4', '#fef08a', '#67e8f9', '#a7f3d0'];
    ctx.textBaseline = 'middle';
    const charSpacing = width / (captchaCode.length + 1);

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      ctx.save();
      const x = (i + 1) * charSpacing;
      const y = height / 2 + (Math.sin(i * 1.5) * 2);
      ctx.translate(x, y);
      const angle = (Math.sin(i * 3 + 1) * 12) * (Math.PI / 180);
      ctx.rotate(angle);
      ctx.font = 'bold 20px "Courier New", monospace, sans-serif';
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(char, -6, 0);
      ctx.restore();
    }
  }, [captchaCode]);

  const handleRefreshClick = () => {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 500);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>کد امنیتی (الزامی):</span>
        </span>
        <span className="text-[10px] text-[#5eead4]/80">برای تغییر روی رفرش بزنید</span>
      </label>

      <div className="flex items-center gap-2">
        {/* Captcha Input */}
        <input
          id={id}
          type="text"
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          required={required}
          value={value}
          maxLength={6}
          onChange={(e) => onChange(toEnglishDigits(e.target.value).trim())}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-[#84cc16] placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-[#99f6e4]/40"
        />

        {/* Captcha Canvas Image */}
        <div
          onClick={handleRefreshClick}
          className="cursor-pointer select-none rounded-xl overflow-hidden border border-[#0d9488]/50 shadow-inner bg-[#042f2e] shrink-0"
          title="جهت بارگذاری مجدد کد امنیتی کلیک کنید"
        >
          <canvas
            ref={canvasRef}
            width={125}
            height={42}
            className="block"
          />
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefreshClick}
          title="تولید کد امنیتی جدید"
          className="p-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-[#a3e635] hover:bg-[#0d9488]/30 hover:text-white transition-all shrink-0 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
