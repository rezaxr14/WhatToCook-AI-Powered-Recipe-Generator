import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { journey, seg, win, isMobileDevice } from './state';

/**
 * Cinematic post-production stack:
 *  - Bloom   — light sources bloom; intensity breathes per chapter
 *  - Chromatic aberration — subtle, peaks on chapter crossfades
 *  - Film grain + vignette — keeps the dark scenes rich and "shot on film"
 *  - ACES tone mapping    — filmic highlight rolloff
 *
 * All values are driven from journey.progress each frame (no React renders).
 */
export const CinematicFX: React.FC = () => {
  const bloom = useRef<any>(null);
  const chroma = useRef<any>(null);
  const noise = useRef<any>(null);
  const mobile = useMemo(() => isMobileDevice(), []);

  useFrame(({ clock }) => {
    const p = journey.progress;
    const t = clock.elapsedTime;

    // --- Chapter light "looks" ------------------------------------------
    const aiGlow = win(p, 0.335, 0.42, 0.5, 0.55); // AI constellation
    const galaxy = win(p, 0.44, 0.5, 0.6, 0.66);
    const flame = win(p, 0.6, 0.64, 0.75, 0.8); // cooking fire
    const finale = win(p, 0.88, 0.96, 1.001, 1.002);
    const hero = 1 - seg(p, 0, 0.12);

    const pulse = 0.86 + Math.sin(t * 1.7) * 0.14;
    const bloomI = 0.34 + aiGlow * 0.85 * pulse + galaxy * 0.25 + flame * 0.4 * pulse + finale * 0.3 + hero * 0.06;

    if (bloom.current) {
      bloom.current.intensity = bloomI;
      bloom.current.threshold = 0.28 - aiGlow * 0.06;
      bloom.current.smoothing = 0.32;
    }

    // Aberration swells during transitions
    const xfade = Math.max(
      win(p, 0.055, 0.09, 0.12, 0.16),
      win(p, 0.3, 0.335, 0.42, 0.46),
      win(p, 0.55, 0.585, 0.64, 0.68),
      win(p, 0.84, 0.88, 0.93, 0.97)
    );
    const swell = 0.0008 + xfade * 0.0009 + (1 - xfade) * 0.00035;
    if (chroma.current) {
      chroma.current.offset.set(swell * (mobile ? 0.55 : 1), swell * 0.35);
    }

    // Grain: heaviest in dreamy chapters, nearly gone in bright finale
    if (noise.current) {
      const g = noise.current;
      const target = 0.055 - finale * 0.03 - hero * 0.012;
      const bm = g.blendMode;
      if (bm && bm.opacity) bm.opacity.value += (target - bm.opacity.value) * 0.08;
    }
  });

  return (
    <EffectComposer multisampling={mobile ? 0 : 4} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.45} luminanceThreshold={0.3} luminanceSmoothing={0.32} radius={0.78} />
      <ChromaticAberration ref={chroma} offset={new THREE.Vector2(0.0009, 0.0004)} radialModulation modulationOffset={0.35} />
      <Noise ref={noise} premultiply />
      <Vignette eskil={false} offset={0.22} darkness={0.82} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};

