import React, { useState, useEffect, useRef, useCallback } from 'react';

interface RisingParticle {
  id: string;
  emoji: string;
  left: number; // 0 to 100%
  duration: number; // in seconds
  size: number; // in px
  drift1: number;
  drift2: number;
  drift3: number;
  drift4: number;
  rot1: number;
  rot2: number;
  rot3: number;
  rot4: number;
  maxOpacity: number;
}

const LIBRARY_EMOJIS = [
  '📚', '📖', '📕', '📗', '📘', '📙',
  '🔖', '📜', '🕯️', '✒️', '🖋️', '👓', '✍️', '✨'
];

export const LibraryEmojiSprinkles: React.FC = () => {
  const [particles, setParticles] = useState<RisingParticle[]>([]);
  const idCounter = useRef(0);
  const scrollTimeoutRef = useRef<any>(null);
  const lastScrollY = useRef(0);
  const isScrollingRef = useRef(false);

  const spawnParticle = useCallback((isScrollBurst: boolean = false) => {
    idCounter.current += 1;
    const emoji = LIBRARY_EMOJIS[Math.floor(Math.random() * LIBRARY_EMOJIS.length)];
    const left = Math.floor(Math.random() * 92) + 4; // 4% to 96%
    const duration = isScrollBurst ? 3.2 + Math.random() * 1.5 : 4.5 + Math.random() * 2.2;
    const size = isScrollBurst ? 19 + Math.floor(Math.random() * 8) : 18 + Math.floor(Math.random() * 7);
    const maxOpacity = isScrollBurst ? 0.65 : 0.5;

    const newParticle: RisingParticle = {
      id: `p-${idCounter.current}-${Date.now()}`,
      emoji,
      left,
      duration,
      size,
      drift1: (Math.random() - 0.5) * 24,
      drift2: (Math.random() - 0.5) * 36,
      drift3: (Math.random() - 0.5) * 28,
      drift4: (Math.random() - 0.5) * 40,
      rot1: (Math.random() - 0.5) * 20,
      rot2: (Math.random() - 0.5) * 30,
      rot3: (Math.random() - 0.5) * 25,
      rot4: (Math.random() - 0.5) * 35,
      maxOpacity,
    };

    setParticles((prev) => {
      // Keep max 28 particles to prevent any DOM bloat
      const next = [...prev, newParticle];
      if (next.length > 28) {
        return next.slice(next.length - 28);
      }
      return next;
    });

    // Remove particle after its duration
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, duration * 1000 + 200);
  }, []);

  // Baseline ambient timer: spawns gentle particles regularly
  useEffect(() => {
    // Initial 4 particles with slight stagger
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnParticle(false), i * 600);
    }

    const interval = setInterval(() => {
      // When scrolling is active, baseline slows down or extra bursts handle it
      if (!isScrollingRef.current) {
        spawnParticle(false);
      }
    }, 1400);

    return () => clearInterval(interval);
  }, [spawnParticle]);

  // Scroll detection to increase intensity dynamically
  useEffect(() => {
    let lastSpawnTime = 0;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // When user scrolls down with positive delta
      if (delta > 2) {
        isScrollingRef.current = true;
        const now = Date.now();
        // Throttle scroll bursts to every ~320ms for buttery smooth, pleasant sprinkling
        if (now - lastSpawnTime > 320) {
          lastSpawnTime = now;
          spawnParticle(true);
          // If rapid scroll, occasionally spawn an extra particle
          if (delta > 25 && Math.random() > 0.4) {
            setTimeout(() => spawnParticle(true), 120);
          }
        }
      }

      // Reset to calm baseline when user stops scrolling
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [spawnParticle]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-96 pointer-events-none z-20 overflow-hidden select-none"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: 'absolute',
              left: `${p.left}%`,
              bottom: '-10px',
              fontSize: `${p.size}px`,
              animation: `gentleRiseFade ${p.duration}s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
              ['--max-opacity' as any]: p.maxOpacity,
              ['--drift-1' as any]: `${p.drift1}px`,
              ['--drift-2' as any]: `${p.drift2}px`,
              ['--drift-3' as any]: `${p.drift3}px`,
              ['--drift-4' as any]: `${p.drift4}px`,
              ['--rot-1' as any]: `${p.rot1}deg`,
              ['--rot-2' as any]: `${p.rot2}deg`,
              ['--rot-3' as any]: `${p.rot3}deg`,
              ['--rot-4' as any]: `${p.rot4}deg`,
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))',
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
