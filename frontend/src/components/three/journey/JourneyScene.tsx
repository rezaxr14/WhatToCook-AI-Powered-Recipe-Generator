import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey, seg, win, isMobileDevice, prefersReducedMotion } from './state';
import { KitchenRoom } from './KitchenRoom';
import { Constellation } from './Constellation';
import { Galaxy, RecipeMatchCards } from './Galaxy';
import { Cooking } from './Cooking';
import { DustField } from './Effects';
import { FadeHtml } from './FadeHtml';
import { useTranslation } from 'react-i18next';

/**
 * The full journey world. One continuous scene; the scroll position is the
 * timeline. Chapters:
 *   0.00–0.30 arrival + fridge    0.30–0.50 AI constellation
 *   0.42–0.63 recipe galaxy       0.55–0.78 cooking
 *   0.73–1.00 finished dish + homecoming + CTA
 */

// ---------- Camera choreography ----------

interface Key {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
}

const KEYS: Key[] = [
  { p: 0.0, pos: [0, 1.6, 7.6], look: [0, 1.35, -0.5] },
  { p: 0.09, pos: [1.0, 1.65, 3.4], look: [2.4, 1.55, -3.0] },
  { p: 0.16, pos: [2.75, 1.7, 1.35], look: [2.4, 1.7, -3.0] },
  { p: 0.24, pos: [3.55, 1.95, 0.3], look: [2.4, 1.95, -3.05] },
  { p: 0.31, pos: [3.2, 1.85, -0.1], look: [2.35, 1.8, -3.05] },
  { p: 0.4, pos: [0, 1.75, 9.2], look: [0, 1.5, 0.5] },
  { p: 0.47, pos: [0, 1.65, 11.8], look: [0, 1.45, 2.0] },
  { p: 0.58, pos: [0, 1.5, 3.6], look: [0, 1.35, -1.0] },
  { p: 0.64, pos: [0, 2.1, 5.0], look: [0, 1.15, 0] },
  { p: 0.73, pos: [1.7, 1.75, 4.0], look: [0, 1.15, 0] },
  { p: 0.9, pos: [0, 1.8, 7.2], look: [0, 1.25, 0] },
  { p: 1.0, pos: [0, 1.6, 5.6], look: [0, 1.15, 0.4] },
];

const DISH = new THREE.Vector3(0, 1.2, 0);

// Scratch vectors — reused every frame so the rig allocates nothing at 60fps.
const _posA = new THREE.Vector3();
const _posB = new THREE.Vector3();
const _lookA = new THREE.Vector3();
const _lookB = new THREE.Vector3();
const _orb = new THREE.Vector3();

const CameraRig: React.FC = () => {
  const target = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3() });

  useFrame(({ camera }, delta) => {
    const p = journey.progress;
    const { pos, look } = target.current;

    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = seg(p, a.p, b.p);
    pos.lerpVectors(_posA.fromArray(a.pos), _posB.fromArray(b.pos), t);
    look.lerpVectors(_lookA.fromArray(a.look), _lookB.fromArray(b.look), t);

    // Cinematic orbit around the finished dish during chapter VI
    const orbitW = seg(p, 0.735, 0.79) * (1 - seg(p, 0.845, 0.9));
    if (orbitW > 0.001) {
      const th = THREE.MathUtils.lerp(-0.7, 2.6, seg(p, 0.735, 0.895));
      pos.lerp(_orb.set(Math.sin(th) * 3.3, 0.5, Math.cos(th) * 3.3).add(DISH), orbitW);
      look.lerp(DISH, orbitW);
    }

    if (prefersReducedMotion()) {
      camera.position.copy(pos);
    } else {
      const k = 1 - Math.exp(-5 * delta);
      camera.position.lerp(pos, k);
    }
    camera.lookAt(look);
  });

  return null;
};

// ---------- Chapter lighting ----------

const ChapterLights: React.FC = () => {
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const aiLight = useRef<THREE.PointLight>(null);
  const keyLight = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    const p = journey.progress;
    const finale = seg(p, 0.87, 0.96);
    if (ambient.current) ambient.current.intensity = 0.5 + finale * 0.5;
    if (hemi.current) hemi.current.intensity = 0.45 + finale * 0.4;
    if (fill.current) fill.current.intensity = 0.55 + finale * 0.5;
    if (aiLight.current) {
      aiLight.current.intensity = win(p, 0.33, 0.38, 0.46, 0.52) * (2.2 + Math.sin(clock.elapsedTime * 1.4) * 0.3);
    }
    if (keyLight.current) keyLight.current.intensity = 1.4 * win(p, 0.72, 0.78, 1.02, 1.04) + finale * 0.8;
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.5} color="#ffedd5" />
      <hemisphereLight ref={hemi} args={['#6b543a', '#1a120b', 0.45]} />
      <directionalLight ref={fill} position={[2.5, 5.5, 7]} intensity={0.55} color="#ffe6c4" />
      <pointLight ref={aiLight} position={[0, 3.4, 2.4]} intensity={0} distance={12} decay={1.6} color="#ffe1a8" />
      <spotLight
        ref={keyLight}
        position={[3.2, 6.5, 4.5]}
        angle={0.5}
        penumbra={0.9}
        intensity={0}
        distance={20}
        decay={1.4}
        color="#fff1dc"
      />
    </>
  );
};

// ---------- In-world fridge labels ----------

const CHIP_CLASS =
  'rounded-full border border-amber-100/40 bg-stone-950/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-amber-100 whitespace-nowrap';

const FridgeLabels: React.FC = () => {
  const { t } = useTranslation();
  const chip = CHIP_CLASS;
  return (
    <>
      <FadeHtml position={[2.2, 2.8, -2.4]} window={[0.215, 0.245, 0.3, 0.33]} distanceFactor={5}>
        <span className={chip}>{t('story.ingEggs')}</span>
      </FadeHtml>
      <FadeHtml position={[1.78, 2.72, -2.4]} window={[0.225, 0.255, 0.3, 0.33]} distanceFactor={5}>
        <span className={chip}>{t('story.ingCheese')}</span>
      </FadeHtml>
      <FadeHtml position={[1.98, 2.08, -2.4]} window={[0.235, 0.265, 0.305, 0.335]} distanceFactor={5}>
        <span className={chip}>{t('story.ingTomato')}</span>
      </FadeHtml>
      <FadeHtml position={[2.8, 2.9, -2.4]} window={[0.245, 0.275, 0.305, 0.335]} distanceFactor={5}>
        <span className={chip}>{t('story.ingMilk')}</span>
      </FadeHtml>
      <FadeHtml position={[2.42, 1.22, -2.4]} window={[0.255, 0.285, 0.31, 0.34]} distanceFactor={5}>
        <span className={chip}>{t('story.ingBasil')}</span>
      </FadeHtml>
      <FadeHtml position={[2.0, 1.28, -2.4]} window={[0.265, 0.295, 0.315, 0.345]} distanceFactor={5}>
        <span className={chip}>{t('story.ingGarlic')}</span>
      </FadeHtml>
    </>
  );
};

// ---------- Scene ----------

export const JourneyScene: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const mobile = isMobileDevice();

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 1.6, 7.6], fov: mobile ? 58 : 44, near: 0.1, far: 70 }}
      gl={{ antialias: !mobile, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ scene, camera }) => {
        scene.fog = new THREE.FogExp2('#070503', 0.042);
        (window as unknown as Record<string, unknown>).__wtcScene = scene;
        (window as unknown as Record<string, unknown>).__wtcCamera = camera;
        setTimeout(onReady, 600);
      }}
      style={{ position: 'absolute', inset: 0, background: '#070503' }}
      aria-hidden
    >
      <ChapterLights />
      <CameraRig />
      <KitchenRoom />
      <Constellation />
      <Galaxy />
      <RecipeMatchCards />
      <Cooking />
      <FridgeLabels />
      <DustField count={mobile ? 70 : 160} />
    </Canvas>
  );
};
