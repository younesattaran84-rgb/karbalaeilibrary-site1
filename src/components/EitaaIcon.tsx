import React from 'react';
import { motion } from 'motion/react';

interface EitaaIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const EitaaIcon: React.FC<EitaaIconProps> = ({
  className = '',
  size = 24,
  animated = false,
}) => {
  const icon = (
    <img
      src="/assets/eitaa_logo.png"
      alt="پیام‌رسان ایتا"
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px`, backgroundColor: '#ffffff' }}
      className={`inline-block shrink-0 rounded-[24%] object-contain shadow-sm bg-white p-0.5 ${className}`}
      loading="lazy"
    />
  );

  if (!animated) {
    return icon;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.15, rotate: 6 }}
      whileTap={{ scale: 0.92 }}
      className="inline-flex items-center justify-center cursor-pointer"
    >
      {icon}
    </motion.div>
  );
};
