import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { LibraryLogo } from './LibraryLogo';
import { HeroSingle3DBook } from './Hero3DBooks';

interface LoadingScreenProps {
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const [isSplitting, setIsSplitting] = useState(false);
  const [isExited, setIsExited] = useState(false);
  const [bookPhase, setBookPhase] = useState<'entering' | 'orbiting' | 'departing'>('entering');

  useEffect(() => {
    // 1. Books fly in from the 4 corners of the screen towards the logo
    const enterTimer = setTimeout(() => {
      setBookPhase('orbiting');
    }, 120);

    // 2. Books fly away / depart after orbiting around the logo
    const departTimer = setTimeout(() => {
      setBookPhase('departing');
    }, 2400);

    // 3. Curtains split open to reveal the site
    const splitTimer = setTimeout(() => {
      triggerSplit();
    }, 2900);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(departTimer);
      clearTimeout(splitTimer);
    };
  }, []);

  const triggerSplit = () => {
    if (isSplitting) return;
    setBookPhase('departing');
    setIsSplitting(true);
    setTimeout(() => {
      setIsExited(true);
      if (onFinish) onFinish();
    }, 850);
  };

  if (isExited) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto">
      {/* LEFT SPLIT CURTAIN */}
      <motion.div
        initial={{ x: 0 }}
        animate={isSplitting ? { x: '-100%' } : { x: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#021f1e] via-[#042f2e] to-[#063f3d] border-r border-[#84cc16]/40 shadow-2xl flex items-center justify-end z-40 overflow-hidden"
      >
        {/* Ambient Glow & Grid lines on left */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#0d9488]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-[#84cc16]/10 blur-3xl pointer-events-none" />
      </motion.div>

      {/* RIGHT SPLIT CURTAIN */}
      <motion.div
        initial={{ x: 0 }}
        animate={isSplitting ? { x: '100%' } : { x: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#021f1e] via-[#042f2e] to-[#063f3d] border-l border-[#84cc16]/40 shadow-2xl flex items-center justify-start z-40 overflow-hidden"
      >
        {/* Ambient Glow & Grid lines on right */}
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#0d9488]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#84cc16]/10 blur-3xl pointer-events-none" />
      </motion.div>

      {/* CENTER GLOW SEAM */}
      {!isSplitting && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0.4, 0.9, 0.4], scaleY: 1 }}
          transition={{
            opacity: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            scaleY: { duration: 0.6 },
          }}
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-[#84cc16] to-transparent z-40 shadow-[0_0_15px_#84cc16]"
        />
      )}

      {/* FLOATING 3D ELEMENTS & HERO LOGO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          isSplitting
            ? { opacity: 0, scale: 1.25, filter: 'blur(8px)' }
            : { opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: isSplitting ? 0.6 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 pointer-events-none"
      >
        {/* Centerpiece: Glowing Badge + Logo with 4 3D Books Flying From Corners to Surround It */}
        <div className="relative flex flex-col items-center text-center">
          
          {/* Logo & Surrounding 3D Books Container */}
          <div className="relative mb-6 flex items-center justify-center">
            
            {/* Luminous Pulsating Halo */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                repeat: Infinity,
                duration: 10,
                ease: 'linear',
              }}
              className="absolute -inset-6 rounded-full bg-gradient-to-r from-[#84cc16]/30 via-[#0d9488]/40 to-[#eab308]/30 blur-xl"
            />
            
            {/* Central Logo */}
            <div className="golden-rotating-border-container p-1 rounded-3xl shadow-2xl relative z-20">
              <div className="bg-[#042f2e] p-4 rounded-[calc(1.5rem-4px)] flex items-center justify-center">
                <LibraryLogo size="lg" showText={false} />
              </div>
            </div>

            {/* Dense 12 Colorful 3D Books Surrounding the Central Logo in an Orbiting Halo */}
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * 2 * Math.PI;
              const radiusX = 165;
              const radiusY = 120;
              const targetX = Math.round(Math.cos(angle) * radiusX);
              const targetY = Math.round(Math.sin(angle) * radiusY);
              const enterX = Math.round(Math.cos(angle) * 700);
              const enterY = Math.round(Math.sin(angle) * 550);
              const exitX = Math.round(Math.cos(angle) * 900);
              const exitY = Math.round(Math.sin(angle) * 750);
              const bookRotation = Math.round(Math.sin(angle) * 25);
              const bookDelay = i * 0.04;

              return (
                <motion.div
                  key={`orbital-book-${i}`}
                  initial={{ x: enterX, y: enterY, scale: 0.2, opacity: 0, rotate: bookRotation * 2 }}
                  animate={
                    bookPhase === 'entering'
                      ? { x: enterX, y: enterY, scale: 0.2, opacity: 0, rotate: bookRotation * 2 }
                      : bookPhase === 'orbiting'
                      ? { x: targetX, y: targetY, scale: 0.8, opacity: 1, rotate: bookRotation }
                      : { x: exitX, y: exitY, scale: 1.25, opacity: 0, rotate: bookRotation * 3 }
                  }
                  transition={{
                    x: bookPhase === 'orbiting' ? { type: 'spring', stiffness: 55, damping: 14, delay: bookDelay } : { duration: 0.6, ease: [0.7, 0, 0.3, 1] },
                    y: bookPhase === 'orbiting' ? { type: 'spring', stiffness: 55, damping: 14, delay: bookDelay } : { duration: 0.6, ease: [0.7, 0, 0.3, 1] },
                    scale: { duration: 0.45 },
                    opacity: { duration: 0.35 },
                    rotate: bookPhase === 'orbiting' ? { type: 'spring', stiffness: 50, damping: 14 } : { duration: 0.55 },
                  }}
                  className="absolute z-30 pointer-events-auto filter drop-shadow-xl"
                >
                  <HeroSingle3DBook
                    bookIndex={i % 6}
                    width={72}
                    height={104}
                    depth={16}
                    initialRotateY={-12 + ((i % 3) * 8)}
                    initialRotateX={6 - ((i % 2) * 12)}
                    initialRotateZ={bookRotation}
                    floatingDuration={3.5 + (i % 4) * 0.5}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Typography */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-1.5"
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>صحن واژه‌ها</span>
              <Sparkles className="w-5 h-5 text-[#84cc16] animate-spin" />
            </h1>
            <p className="text-sm sm:text-base font-bold text-[#99f6e4]">
              کتابخانه شهید احسان کربلایی‌پور
            </p>
          </motion.div>

          {/* Progress / Pulse Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <div className="w-36 h-1 rounded-full bg-[#073834] overflow-hidden border border-[#0d9488]/30">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                className="w-full h-full bg-gradient-to-r from-[#0d9488] via-[#84cc16] to-[#a3e635]"
              />
            </div>
            <span className="text-[11px] text-[#5eead4]/80 font-medium">
              در حال گشودن گنجینه کتابخانه...
            </span>
          </motion.div>

          {/* Direct Skip Button (Pointer-events active) */}
          <button
            type="button"
            onClick={triggerSplit}
            className="mt-6 pointer-events-auto px-4 py-1.5 rounded-full bg-[#073834]/80 hover:bg-[#0d9488]/40 border border-[#0d9488]/40 text-[#99f6e4] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
          >
            <span>ورود مستقیم</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
