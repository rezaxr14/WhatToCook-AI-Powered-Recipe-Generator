import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { journey, seg, win, isMobileDevice } from './state';

/**
 * Cinematic post-production stack:
 *  - Bloom   — light sources bloom; intensity breathes per chapter
 *  - Chromatic aberration — very subtle, quiet in bright close-ups
 *  - Vignette + ACES tone mapping — filmic frame and highlight rolloff
 *
 * Deliberately NO film-grain noise effect: its per-frame random pixels read
 * as light flicker on large bright surfaces (fridge interior, pendant-lit
 * walls), which reads as a broken lamp instead of "shot on film".
 *
 * All values are driven from journey.progress each frame (no React renders).
 *
 * Adaptive quality: never unmounts (an unmount mid-scroll pops the whole
 * look and reads as a glitch). If frames stay heavy the bloom simply backs
 * off to a whisper, and it breathes back up once the framerate recovers.
 * MSAA is kept off — the composer's multisampled targets re-allocate on
 * resize and double the fill cost for almost no visible gain here.
 */
export const CinematicFX: React.FC = () => {
  const bloom = useRef<any>(null);
  const chroma = useRef<any>(null);
  const mobile = useMemo(() => isMobileDevice(), []);
  const [degraded, setDegraded] = useState(false);
  const emaRef = useRef(0);
  const heavyFrames = useRef(0);
  const lightFrames = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.25);
    emaRef.current = emaRef.current * 0.94 + dt * 0.06;
    if (!degraded) {
      if (emaRef.current > 0.042) {
        heavyFrames.current += 1;
        if (heavyFrames.current > 150) setDegraded(true); // ~6s at <24fps
      } else {
        heavyFrames.current = Math.max(0, heavyFrames.current - 1);
      }
    } else if (emaRef.current < 0.02) {
      lightFrames.current += 1;
      if (lightFrames.current > 120) {
        setDegraded(false); // framerate recovered — bloom returns
        lightFrames.current = 0;
      }
    } else {
      lightFrames.current = Math.max(0, lightFrames.current - 1);
    }
  });

  useFrame(({ clock }) => {
    const p = journey.progress;
    const t = clock.elapsedTime;

    // --- Chapter light "looks" ------------------------------------------
    const aiGlow = win(p, 0.335, 0.42, 0.5, 0.55); // AI constellation
    const galaxy = win(p, 0.44, 0.5, 0.6, 0.66);
    const flame = win(p, 0.6, 0.64, 0.75, 0.8); // cooking fire
    const finale = win(p, 0.88, 0.96, 1.001, 1.002);
    const hero = 1 - seg(p, 0, 0.12);

    // Slow breathing — very subtle so bright interiors never visibly pulse
    const pulse = 0.97 + Math.sin(t * 1.15) * 0.045;
    const bloomI = 0.36 + aiGlow * 0.8 * pulse + galaxy * 0.22 + flame * 0.38 * pulse + finale * 0.3 + hero * 0.14;

    if (bloom.current) {
      // Degraded = framerate starving: keep the stack mounted but drop the
      // bloom to a whisper; it breathes back once frames recover.
      bloom.current.intensity = degraded ? 0.12 : bloomI;
      bloom.current.threshold = 0.45 - aiGlow * 0.04;
      bloom.current.smoothing = 0.34;
    }

    // Aberration swells only during transitions; near-silent inside the
    // bright chapters (edge shimmer there reads as instability).
    const xfade = Math.max(
      win(p, 0.055, 0.09, 0.12, 0.16),
      win(p, 0.3, 0.335, 0.42, 0.46),
      win(p, 0.55, 0.585, 0.64, 0.68),
      win(p, 0.84, 0.88, 0.93, 0.97)
    );
    const swell = 0.00045 + xfade * 0.00055;
    if (chroma.current) {
      chroma.current.offset.set(swell * (mobile ? 0.5 : 1), swell * 0.3);
    }
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.45} luminanceThreshold={0.3} luminanceSmoothing={0.34} radius={0.78} />
      <ChromaticAberration ref={chroma} offset={new THREE.Vector2(0.0006, 0.0002)} radialModulation modulationOffset={0.35} />
      <Vignette eskil={false} offset={0.22} darkness={0.82} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};
