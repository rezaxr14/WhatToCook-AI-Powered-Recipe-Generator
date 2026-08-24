import * as THREE from 'three';

/**
 * Shared scroll state for the landing journey. The page scroll handler in
 * LandingPage writes `progress` (0..1 across the whole journey track); the 3D
 * scene reads it inside useFrame — no React re-renders, 60fps-friendly.
 */
export const journey = { progress: 0 };

/** Smooth 0..1 ramp of p between a..b. */
export const seg = (p: number, a: number, b: number): number =>
  THREE.MathUtils.smoothstep(p, a, b);

/** Window ramp: 0 → 1 between a..b, 1 → 0 between c..d. */
export const win = (p: number, a: number, b: number, c: number, d: number): number =>
  seg(p, a, b) * (1 - seg(p, c, d));

export const isMobileDevice = (): boolean => {
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  } catch {
    return false;
  }
};

export const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
