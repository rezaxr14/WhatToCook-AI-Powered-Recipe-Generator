import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey, seg, isMobileDevice } from './state';
import { FadeHtml } from './FadeHtml';
import { useTranslation } from 'react-i18next';

/**
 * Chapter IV: the recipe galaxy. Hundreds of glowing dish-stars fill the space
 * and the camera flies straight through them; the closest burns brightest.
 */

const WARM = ['#ffe9c4', '#f5b95c', '#ff9d5c', '#e8654f'];
const COOL = ['#9ad7c9', '#c9b89a'];

export const Galaxy: React.FC = () => {
  const points = useRef<THREE.Points>(null);
  const count = useMemo(() => (isMobileDevice() ? 380 : 780), []);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Hollow cylinder shell so the camera can fly through the middle
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.1 + Math.pow(Math.random(), 0.7) * 7.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.4;
      positions[i * 3 + 2] = -3 + Math.random() * 19;

      c.set(Math.random() < 0.82 ? WARM[Math.floor(Math.random() * WARM.length)] : COOL[Math.floor(Math.random() * COOL.length)]);
      const dim = 0.45 + Math.random() * 0.55;
      colors[i * 3] = c.r * dim;
      colors[i * 3 + 1] = c.g * dim;
      colors[i * 3 + 2] = c.b * dim;
    }
    return { positions, colors };
  }, [count]);

  useFrame(({ clock }) => {
    const pts = points.current;
    if (!pts) return;
    const p = journey.progress;
    const presence = seg(p, 0.415, 0.47) * (1 - seg(p, 0.585, 0.63));
    pts.visible = presence > 0.001;
    if (!pts.visible) return;
    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity = presence * (0.85 + Math.sin(clock.elapsedTime * 2.2) * 0.1);
    pts.rotation.y = clock.elapsedTime * 0.016;
  });

  return (
    <points ref={points} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
};

/** Floating holographic match cards inside the galaxy. */
export const RecipeMatchCards: React.FC = () => {
  const { t } = useTranslation();
  const card =
    'w-44 rounded-2xl border border-amber-200/30 bg-stone-950/70 backdrop-blur-md px-4 py-3 text-left shadow-[0_0_40px_rgba(245,185,92,0.15)]';
  const title = 'text-[13px] font-bold text-amber-100 leading-tight';
  const meta = 'mt-1 text-[10px] font-semibold text-amber-200/70';

  return (
    <>
      <FadeHtml position={[-1.7, 0.75, 7.6]} window={[0.475, 0.5, 0.535, 0.56]} distanceFactor={7}>
        <div className={card}>
          <div className="text-[10px] font-black tracking-[0.2em] text-amber-400">92% {t('story.match')}</div>
          <div className={`${title} mt-1`}>{t('story.cardName')}</div>
          <div className={meta}>{t('story.uses', { n: 6 })} · {t('story.missing')}</div>
        </div>
      </FadeHtml>
      <FadeHtml position={[1.8, -0.35, 5.9]} window={[0.5, 0.525, 0.56, 0.585]} distanceFactor={7}>
        <div className={card}>
          <div className="text-[10px] font-black tracking-[0.2em] text-amber-400">87% {t('story.match')}</div>
          <div className={`${title} mt-1`}>{t('story.card2Name')}</div>
          <div className={meta}>{t('story.uses', { n: 5 })}</div>
        </div>
      </FadeHtml>
      <FadeHtml position={[-0.5, 1.6, 4.5]} window={[0.525, 0.55, 0.585, 0.61]} distanceFactor={7}>
        <div className={card}>
          <div className="text-[10px] font-black tracking-[0.2em] text-amber-400">81% {t('story.match')}</div>
          <div className={`${title} mt-1`}>{t('story.card3Name')}</div>
          <div className={meta}>{t('story.uses', { n: 4 })}</div>
        </div>
      </FadeHtml>
    </>
  );
};
