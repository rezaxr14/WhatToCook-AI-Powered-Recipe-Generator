import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey, seg, win } from './state';

/** Soft radial sprite texture generated once (no external assets). */
const makeGlowTexture = (): THREE.CanvasTexture => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,244,230,0.9)');
  grad.addColorStop(0.4, 'rgba(255,236,214,0.35)');
  grad.addColorStop(1, 'rgba(255,236,214,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

interface SteamEmitterProps {
  position: [number, number, number];
  /** journey-progress window [inStart, inEnd, outStart, outEnd]. */
  window: [number, number, number, number];
  count?: number;
  spread?: number;
  rise?: number;
}

/** Rising, fading steam puffs — the kitchen always feels alive. */
export const SteamEmitter: React.FC<SteamEmitterProps> = ({
  position,
  window: w,
  count = 12,
  spread = 0.3,
  rise = 1.5,
}) => {
  const group = useRef<THREE.Group>(null);
  const tex = useMemo(makeGlowTexture, []);
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        off: Math.random(),
        speed: 0.16 + Math.random() * 0.2,
        x: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * spread,
        size: 0.35 + Math.random() * 0.5,
      })),
    [count, spread]
  );

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const strength = win(journey.progress, w[0], w[1], w[2], w[3]);
    g.visible = strength > 0.01;
    if (!g.visible) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      const pt = parts[i];
      const cyc = (t * pt.speed + pt.off) % 1;
      child.position.set(pt.x * (0.5 + cyc), cyc * rise, pt.z * (0.5 + cyc));
      const mat = (child as THREE.Sprite).material as THREE.SpriteMaterial;
      mat.opacity = Math.sin(Math.PI * cyc) * 0.28 * strength;
      child.scale.setScalar(pt.size * (0.45 + cyc * 1.5));
    });
  });

  return (
    <group ref={group} position={position}>
      {parts.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
};

/** Ambient dust motes drifting through the light for volumetric depth. */
export const DustField: React.FC<{ count?: number }> = ({ count = 160 }) => {
  const ref = useRef<THREE.Points>(null);
  const { positions, drift } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const drift = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 4.2;
      positions[i * 3 + 2] = -6 + Math.random() * 15;
      drift[i] = Math.random() * Math.PI * 2;
    }
    return { positions, drift };
  }, [count]);

  useFrame(({ clock }) => {
    const pts = ref.current;
    if (!pts) return;
    const t = clock.elapsedTime;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      pos.setY(i, 0.4 + Math.abs(Math.sin(t * 0.08 + drift[i])) * 3.6);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.05 + drift[i]) * 0.0006);
    }
    pos.needsUpdate = true;
    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity = 0.16 + seg(journey.progress, 0.86, 0.95) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#ffe8c4"
        transparent
        opacity={0.18}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
