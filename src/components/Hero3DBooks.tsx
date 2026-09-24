import React, { useState } from 'react';
import { motion } from 'motion/react';

interface Book3DSolidItem {
  id: string;
  name: string;
  spineGradient: string;
  coverGradient: string;
  accentGlow: string;
  pageTone: string;
}

const SOLID_3D_BOOKS: Book3DSolidItem[] = [
  {
    id: 'book-emerald',
    name: 'کتاب سبز زمردی اسلامی',
    spineGradient: 'from-[#065f46] via-[#047857] to-[#022c22]',
    coverGradient: 'from-[#047857] via-[#065f46] to-[#022c22]',
    accentGlow: 'rgba(132, 204, 22, 0.5)',
    pageTone: 'repeating-linear-gradient(to right, #fef3c7 0px, #fde68a 1px, #e2e8f0 2px)',
  },
  {
    id: 'book-teal',
    name: 'کتاب فیروزه‌ای متالیک',
    spineGradient: 'from-[#0f766e] via-[#0d9488] to-[#134e4a]',
    coverGradient: 'from-[#0d9488] via-[#0f766e] to-[#042f2e]',
    accentGlow: 'rgba(94, 234, 212, 0.45)',
    pageTone: 'repeating-linear-gradient(to right, #fef3c7 0px, #fde68a 1px, #cbd5e1 2px)',
  },
  {
    id: 'book-amber',
    name: 'کتاب طلایی کهربایی',
    spineGradient: 'from-[#b45309] via-[#d97706] to-[#78350f]',
    coverGradient: 'from-[#d97706] via-[#b45309] to-[#451a03]',
    accentGlow: 'rgba(250, 204, 21, 0.45)',
    pageTone: 'repeating-linear-gradient(to right, #fef3c7 0px, #fde68a 1px, #fcd34d 2px)',
  },
  {
    id: 'book-sapphire',
    name: 'کتاب لاجوردی سلطنتی',
    spineGradient: 'from-[#0369a1] via-[#0284c7] to-[#082f49]',
    coverGradient: 'from-[#0284c7] via-[#0369a1] to-[#082f49]',
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    pageTone: 'repeating-linear-gradient(to right, #fef3c7 0px, #fde68a 1px, #bae6fd 2px)',
  },
  {
    id: 'book-ruby',
    name: 'کتاب یاقوتی سرخ',
    spineGradient: 'from-[#be123c] via-[#e11d48] to-[#4c0519]',
    coverGradient: 'from-[#e11d48] via-[#be123c] to-[#4c0519]',
    accentGlow: 'rgba(251, 113, 133, 0.45)',
    pageTone: 'repeating-linear-gradient(to right, #fef3c7 0px, #fde68a 1px, #fecdd3 2px)',
  },
  {
    id: 'book-purple',
    name: 'کتاب بنفش معنوی',
    spineGradient: 'from-[#7e22ce] via-[#9333ea] to-[#3b0764]',
    coverGradient: 'from-[#9333ea] via-[#7e22ce] to-[#3b0764]',
    accentGlow: 'rgba(192, 132, 252, 0.45)',
    pageTone: 'repeating-linear-gradient(to right, #fef3c7 0px, #fde68a 1px, #e9d5ff 2px)',
  },
];

interface Single3DBookProps {
  bookIndex: number;
  width?: number;
  height?: number;
  depth?: number;
  className?: string;
  initialRotateY?: number;
  initialRotateX?: number;
  initialRotateZ?: number;
  floatingDuration?: number;
  forceGreenTheme?: boolean;
}

export const HeroSingle3DBook: React.FC<Single3DBookProps> = ({
  bookIndex,
  width = 110,
  height = 150,
  depth = 22,
  className = '',
  initialRotateY = -15,
  initialRotateX = 6,
  initialRotateZ = -4,
  floatingDuration = 5,
  forceGreenTheme = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const rawBook = SOLID_3D_BOOKS[bookIndex % SOLID_3D_BOOKS.length];
  const book = forceGreenTheme
    ? {
        ...rawBook,
        spineGradient: 'from-[#065f46] via-[#047857] to-[#022c22]',
        coverGradient: 'from-[#047857] via-[#065f46] to-[#022c22]',
        accentGlow: 'rgba(132, 204, 22, 0.55)',
      }
    : rawBook;

  return (
    <div
      className={`relative select-none pointer-events-auto cursor-pointer group ${className}`}
      style={{ perspective: 1000 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          y: isHovered ? -10 : [0, -7, 0],
          rotateY: isHovered ? initialRotateY - 14 : [initialRotateY, initialRotateY - 4, initialRotateY],
          rotateX: isHovered ? initialRotateX + 4 : [initialRotateX, initialRotateX + 2, initialRotateX],
          rotateZ: isHovered ? initialRotateZ + 3 : [initialRotateZ, initialRotateZ - 2, initialRotateZ],
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: floatingDuration,
            ease: 'easeInOut',
          },
          rotateY: isHovered
            ? { duration: 0.3 }
            : { repeat: Infinity, duration: floatingDuration * 1.2, ease: 'easeInOut' },
          rotateX: isHovered
            ? { duration: 0.3 }
            : { repeat: Infinity, duration: floatingDuration * 1.1, ease: 'easeInOut' },
          rotateZ: isHovered
            ? { duration: 0.3 }
            : { repeat: Infinity, duration: floatingDuration, ease: 'easeInOut' },
        }}
        style={{
          transformStyle: 'preserve-3d',
          width,
          height,
        }}
      >
        {/* Main 3D Volume Container */}
        <div
          className="w-full h-full relative rounded-r-xl rounded-l-md transition-all duration-300"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: isHovered
              ? `0 20px 35px -8px rgba(0, 0, 0, 0.7), 0 0 25px ${book.accentGlow}`
              : `0 12px 24px -6px rgba(0, 0, 0, 0.6), 0 0 14px ${book.accentGlow}`,
          }}
        >
          {/* Front Solid Cover (Pure color, no text, subtle luxury sheen) */}
          <div
            className={`w-full h-full rounded-r-xl rounded-l-md bg-gradient-to-br ${book.coverGradient} border border-white/25 relative overflow-hidden`}
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Subtle Leather/Cloth Texture & Foil Vignette */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none" />

            {/* Spine Crease Shadow along the right edge (RTL perspective) */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black/50 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute right-2.5 top-0 bottom-0 w-[1px] bg-white/25 pointer-events-none" />

            {/* Minimal Geometric Gold Foil Frame (No text, pure aesthetic) */}
            <div className="absolute inset-3 rounded-lg border border-amber-300/30 pointer-events-none" />
            <div className="absolute inset-4 rounded border border-amber-300/20 pointer-events-none" />

            {/* Light sweep reflection */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-1000 pointer-events-none"
              style={{ transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)' }}
            />
          </div>

          {/* 3D Book Spine (Right edge for RTL view) */}
          <div
            className={`absolute top-0 right-0 h-full bg-gradient-to-b ${book.spineGradient} border-l border-white/20`}
            style={{
              width: depth,
              transform: `rotateY(90deg) translateZ(${depth / 2}px)`,
              transformOrigin: 'right center',
            }}
          >
            {/* Ribbed spine bands (pure solid gold ribs, no text) */}
            <div className="h-full flex flex-col justify-around py-3 px-1">
              <div className="w-full h-[2px] bg-amber-400/40 rounded-full" />
              <div className="w-full h-[2px] bg-amber-400/40 rounded-full" />
              <div className="w-full h-[2px] bg-amber-400/40 rounded-full" />
              <div className="w-full h-[2px] bg-amber-400/40 rounded-full" />
            </div>
          </div>

          {/* 3D Book Pages Thickness (Left edge) */}
          <div
            className="absolute top-0 left-0 h-full rounded-l-sm"
            style={{
              width: depth - 2,
              transform: `rotateY(-90deg) translateZ(${(depth - 2) / 2}px)`,
              transformOrigin: 'left center',
              backgroundImage: book.pageTone,
            }}
          />

          {/* 3D Book Top Page Edges */}
          <div
            className="absolute top-0 left-0 w-full bg-[#fef3c7] border-b border-stone-400"
            style={{
              height: depth - 2,
              transform: `rotateX(90deg) translateZ(${(depth - 2) / 2}px)`,
              transformOrigin: 'top center',
            }}
          />
        </div>

        {/* Floor Shadow with dynamic blur */}
        <div
          className="absolute -bottom-4 left-2 right-2 h-4 bg-black/60 rounded-full blur-md transition-all duration-300 pointer-events-none"
          style={{
            transform: isHovered ? 'scale(1.2) translateY(5px)' : 'scale(0.95)',
            opacity: isHovered ? 0.8 : 0.45,
          }}
        />
      </motion.div>
    </div>
  );
};

export const Hero3DBooks: React.FC = () => {
  return null;
};
