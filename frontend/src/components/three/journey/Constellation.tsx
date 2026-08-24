import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey, seg } from './state';
import { Tomato, Garlic, BasilPot, CheeseWedge, Egg, Lemon, BellPepper, Mushroom } from './Ingredients';

/**
 * Chapter III: the AI moment. The fridge ingredients levitate into a rotating
 * constellation while luminous lines draw the relationships between them —
 * the machine quietly understanding the kitchen.
 */

const RING: Array<[number, number, number]> = [
  [2.55, 0.35, 0],
  [1.8, 1.4, 0.55],
  [0.4, 2.0, 0.8],
  [-1.15, 1.5, 0.5],
  [-2.4, 0.45, 0],
  [-1.55, -0.65, -0.55],
  [0.15, -1.25, -0.8],
  [1.65, -0.8, -0.5],
];

const LINKS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [0, 3], [1, 4], [2, 5], [2, 6], [0, 5], [3, 6],
];

export const Constellation: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const halo = useRef<THREE.Mesh>(null);

  const nodes = useMemo(
    () => [
      <Tomato key="tomato" scale={0.75} position={[0, -0.32, 0]} />,
      <Garlic key="garlic" scale={0.8} position={[0, -0.4, 0]} />,
      <BasilPot key="basil" scale={0.7} position={[0, -0.25, 0]} />,
      <CheeseWedge key="cheese" scale={0.7} position={[-0.24, -0.16, 0.21]} />,
      <Egg key="egg" scale={0.85} position={[0, -0.31, 0]} />,
      <Lemon key="lemon" scale={0.7} position={[0, -0.52, 0]} />,
      <BellPepper key="pepper" scale={0.75} position={[0, -0.33, 0]} />,
      <Mushroom key="mushroom" scale={0.75} position={[0, -0.25, 0]} />,
    ],
    []
  );

  const lineGeometry = useMemo(() => {
    const pts: number[] = [];
    for (const [a, b] of LINKS) {
      pts.push(...RING[a], ...RING[b]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  useFrame(({ clock }, delta) => {
    const p = journey.progress;
    const g = group.current;
    if (!g) return;
    const presence = seg(p, 0.335, 0.4) * (1 - seg(p, 0.455, 0.5));
    g.visible = presence > 0.001;
    if (!g.visible) return;

    const s = Math.max(presence, 0.001);
    g.scale.setScalar(s);
    g.rotation.y = clock.elapsedTime * 0.14;
    g.position.y = 1.55 + Math.sin(clock.elapsedTime * 0.5) * 0.06;

    const mat = lines.current?.material as THREE.LineBasicMaterial | undefined;
    if (mat) {
      mat.opacity = presence * (0.28 + Math.sin(clock.elapsedTime * 1.8) * 0.08);
    }
    if (halo.current) {
      const hm = halo.current.material as THREE.MeshBasicMaterial;
      hm.opacity = presence * 0.05;
      halo.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.9) * 0.04);
    }
    // Gentle per-node breathing around each node's ring height
    g.children.forEach((child, i) => {
      if (!RING[i]) return; // halo mesh / link lines
      child.position.y = RING[i][1] + Math.sin(clock.elapsedTime * 0.9 + i * 1.7) * 0.05;
    });
    // keep line geometry static relative to ring (children breathe only slightly)
    lines.current?.geometry.setAttribute('position', lines.current.geometry.getAttribute('position'));
    void delta;
  });

  return (
    <group ref={group} position={[0, 1.55, 0.6]} scale={0.001}>
      {nodes.map((node, i) => (
        <group key={i} position={RING[i]}>
          {node}
        </group>
      ))}
      <mesh ref={halo}>
        <sphereGeometry args={[3.2, 24, 24]} />
        <meshBasicMaterial color="#f5c97b" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <lineSegments ref={lines} geometry={lineGeometry}>
        <lineBasicMaterial color="#f5c97b" transparent opacity={0} depthWrite={false} />
      </lineSegments>
    </group>
  );
};
