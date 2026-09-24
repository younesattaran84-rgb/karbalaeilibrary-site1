import React from 'react';
import { motion } from 'motion/react';

interface LibraryLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  customLogoUrl?: string;
  customTitle?: string;
  customSubtitle?: string;
  customLogoScale?: number;
  customLogoFit?: 'contain' | 'cover' | 'fill';
  customLogoRadius?: string;
}

export const LibraryLogo: React.FC<LibraryLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  animated = true,
  customLogoUrl,
  customTitle,
  customSubtitle,
  customLogoScale,
  customLogoFit,
  customLogoRadius,
}) => {
  const iconDimensions = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  const titleSize = {
    sm: 'text-sm font-bold',
    md: 'text-base font-extrabold',
    lg: 'text-xl font-black',
    xl: 'text-2xl font-black',
  }[size];

  const subSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* High-contrast Emblem Badge with Official Uploaded PNG Logo */}
      <motion.div
        animate={
          animated
            ? {
                y: [0, -4, 0],
                rotate: [0, 0.5, -0.5, 0],
              }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: 4.5,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.08, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        className={`${iconDimensions} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#042f2e] p-1.5 shadow-lg shadow-[#0d9488]/20 border border-[#0d9488]/40 transition-shadow duration-300 hover:shadow-[#14b8a6]/40 cursor-pointer overflow-hidden group`}
      >
        {/* Shimmer light sweep across logo */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />

        {/* Real Uploaded PNG Logo */}
        <img
          src={customLogoUrl || "/assets/sahne_vajeha_logo.png"}
          alt="لوگو صحن واژه‌ها - کتابخانه شهید احسان کربلایی‌پور"
          style={{
            objectFit: customLogoFit || 'contain',
            borderRadius: customLogoRadius || '0.75rem',
            transform: customLogoScale ? `scale(${customLogoScale / 100})` : undefined,
          }}
          className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] group-hover:brightness-110 transition-all duration-300"
          loading="eager"
        />
      </motion.div>

      {showText && (
        <div className="flex flex-col text-right">
          <div className={`${titleSize} text-white tracking-wide flex items-center gap-2`}>
            <span className="shimmer-text font-black">{customTitle || 'صحن واژه‌ها'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/40 font-bold shadow-sm">
              کتابخانه
            </span>
          </div>
          <span className={`${subSize} text-[#99f6e4] font-medium leading-tight mt-0.5 group-hover:text-white transition-colors`}>
            {customSubtitle || 'کتابخانه شهید احسان کربلایی‌پور'}
          </span>
        </div>
      )}
    </div>
  );
};
