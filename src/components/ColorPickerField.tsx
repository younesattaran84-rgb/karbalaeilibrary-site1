import React, { useState, useEffect } from 'react';
import { Pipette, Check } from 'lucide-react';

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  helperText?: string;
}

const PRESET_SWATCHES = [
  { name: 'سبز لیمویی نئونی', hex: '#84cc16' },
  { name: 'سبز زبرجد اسلامی', hex: '#059669' },
  { name: 'کله‌غازی عمیق', hex: '#0d9488' },
  { name: 'طلایی کهربایی', hex: '#f59e0b' },
  { name: 'فیروزه‌ای روشن', hex: '#06b6d4' },
  { name: 'آبی اقیانوسی', hex: '#0284c7' },
  { name: 'یاقوتی اناری', hex: '#e11d48' },
  { name: 'ارغوانی بنفش', hex: '#9333ea' },
  { name: 'نارنجی ایتا', hex: '#f37021' },
];

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
}) => {
  // Normalize color value to hex if possible
  const extractHex = (val: string): string => {
    if (!val) return '#84cc16';
    const match = val.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
    return match ? match[0] : (val.startsWith('#') ? val : '#84cc16');
  };

  const [currentColor, setCurrentColor] = useState<string>(() => extractHex(value));
  const [hexInput, setHexInput] = useState<string>(() => extractHex(value));

  useEffect(() => {
    const hex = extractHex(value);
    setCurrentColor(hex);
    setHexInput(hex);
  }, [value]);

  const handleColorChange = (newHex: string) => {
    setCurrentColor(newHex);
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    setHexInput(raw);
    if (/^#[0-9a-fA-F]{6}$/i.test(raw) || /^#[0-9a-fA-F]{3}$/i.test(raw)) {
      setCurrentColor(raw);
      onChange(raw);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#ccfbf1] flex items-center gap-1.5">
          <Pipette className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>{label}</span>
        </label>
        <span className="text-[11px] font-mono text-[#a3e635] bg-[#042f2e] px-2 py-0.5 rounded border border-[#84cc16]/30 uppercase">
          {currentColor}
        </span>
      </div>

      {/* Main Color Picker Box (Photoshop Style Spectrum + Input) */}
      <div className="p-3 rounded-xl bg-[#042f2e]/80 border border-[#0d9488]/40 space-y-3">
        <div className="flex items-center gap-3">
          {/* Native HTML5 Color Picker styled as large tactile swatch */}
          <div className="relative group shrink-0">
            <input
              type="color"
              value={currentColor.startsWith('#') && (currentColor.length === 7 || currentColor.length === 4) ? currentColor : '#84cc16'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer opacity-0 absolute inset-0 z-10"
              title="برای انتخاب طیف رنگی فتوشاپی کلیک کنید"
            />
            <div
              className="w-12 h-12 rounded-xl border-2 border-white/50 shadow-md transition-transform group-hover:scale-105 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: currentColor }}
            >
              <Pipette className="w-5 h-5 text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          {/* Hex Code Input Field */}
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-[#99f6e4]/80">کد هگزادسیمال رنگ (HEX):</span>
            <div className="relative">
              <input
                type="text"
                value={hexInput}
                onChange={handleHexInputChange}
                placeholder="#84cc16"
                maxLength={7}
                className="w-full px-3 py-2 rounded-lg bg-[#073834] border border-[#0d9488]/50 text-white font-mono text-xs text-left tracking-wider uppercase focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>
        </div>

        {/* Quick Color Palette Swatches */}
        <div>
          <span className="text-[10px] text-[#99f6e4]/70 mb-1.5 block">پالت‌های برگزیده و هماهنگ:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_SWATCHES.map((swatch) => {
              const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => handleColorChange(swatch.hex)}
                  title={swatch.name}
                  className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                    isSelected ? 'border-white scale-110 shadow-lg ring-2 ring-white/50' : 'border-white/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-[#99f6e4]/70 leading-relaxed">{helperText}</p>
      )}
    </div>
  );
};
