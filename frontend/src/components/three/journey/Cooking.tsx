import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey, seg, win } from './state';
import { TomatoChunk, Garlic, BasilPot } from './Ingredients';
import { SteamEmitter } from './Effects';

// Sauce tint endpoints — hoisted so the per-frame update allocates nothing.
const SAUCE_BASE = new THREE.Color('#e2603f');
const SAUCE_DARK = new THREE.Color('#a83520');

/**
 * Chapter V–VI: the magic moment. Ingredients drop into the pan, the flame
 * roars, the sauce develops — then the pan gives way to the finished dish,
 * plated and steaming, slowly presenting itself.
 */
export const Cooking: React.FC = () => {
  const station = useRef<THREE.Group>(null);
  const pan = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const flameLight = useRef<THREE.PointLight>(null);
  const sauce = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.Group>(null);
  const dish = useRef<THREE.Group>(null);
  const pasta = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const p = journey.progress;
    const t = clock.elapsedTime;

    // Cooking station lifecycle
    const stationIn = seg(p, 0.555, 0.6);
    const stationOut = 1 - seg(p, 0.725, 0.775);
    const st = stationIn * stationOut;
    if (station.current) {
      station.current.visible = st > 0.001;
      station.current.scale.setScalar(Math.max(st, 0.001));
      station.current.position.y = 1.02 + (1 - st) * -0.4;
    }

    // Flame flicker
    const flameOn = win(p, 0.6, 0.625, 0.72, 0.775);
    if (flame.current) {
      flame.current.visible = flameOn > 0.01;
      const flick = 0.85 + Math.sin(t * 21) * 0.12 + Math.sin(t * 47.3) * 0.06;
      flame.current.scale.set(flameOn * flick, flameOn * (0.9 + flick * 0.35), flameOn * flick);
      const fm = flame.current.material as THREE.MeshBasicMaterial;
      fm.opacity = flameOn * 0.9;
    }
    if (flameLight.current) {
      flameLight.current.intensity = flameOn * (2.6 + Math.sin(t * 31.7) * 0.7);
    }

    // Sauce developing in the pan
    if (sauce.current) {
      const s = seg(p, 0.655, 0.715);
      sauce.current.scale.setScalar(Math.max(s, 0.001) * (1 + Math.sin(t * 2.4) * 0.015));
      sauce.current.visible = s > 0.001;
      const sm = sauce.current.material as THREE.MeshPhysicalMaterial;
      sm.color.copy(SAUCE_BASE).lerp(SAUCE_DARK, s);
    }

    // Ingredients dropping into the pan
    if (drops.current) {
      const drop = seg(p, 0.585, 0.645);
      drops.current.visible = drop > 0.001 && p < 0.73;
      drops.current.children.forEach((child, i) => {
        const local = THREE.MathUtils.clamp(drop * 1.6 - i * 0.09, 0, 1);
        child.position.y = 2.3 - local * 1.15;
        child.rotation.x = local * 5 + i;
        child.rotation.z = local * 3.5;
      });
    }

    // The finished dish takes over
    const dishIn = seg(p, 0.725, 0.785);
    if (dish.current) {
      dish.current.visible = dishIn > 0.001;
      dish.current.scale.setScalar(Math.max(dishIn, 0.001));
      dish.current.position.y = 1.12 + (1 - dishIn) * -0.5;
      dish.current.rotation.y = t * 0.22;
    }
    if (pasta.current) {
      const nest = seg(p, 0.74, 0.8);
      pasta.current.scale.setScalar(Math.max(nest, 0.001));
      pasta.current.rotation.y = nest * 2.4;
    }
  });

  return (
    <>
      {/* ---- Cooking station ---- */}
      <group ref={station} scale={0.001}>
        {/* Stone slab cooktop */}
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[2.7, 0.12, 1.7]} />
          <meshPhysicalMaterial color="#211b15" roughness={0.4} clearcoat={0.5} />
        </mesh>

        {/* Pan */}
        <group ref={pan} position={[0, 0.24, 0]}>
          <mesh>
            <cylinderGeometry args={[0.72, 0.6, 0.14, 40]} />
            <meshPhysicalMaterial color="#1c1c20" roughness={0.32} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.66, 0.022, 10, 40]} />
            <meshStandardMaterial color="#2c2c33" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0.98, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.05, 0.62, 12]} />
            <meshPhysicalMaterial color="#3a2c1e" roughness={0.6} />
          </mesh>

          {/* Sauce forming inside */}
          <mesh ref={sauce} position={[0, 0.06, 0]} scale={0.001} visible={false}>
            <cylinderGeometry args={[0.56, 0.5, 0.05, 32]} />
            <meshPhysicalMaterial color="#e2603f" roughness={0.22} clearcoat={0.9} clearcoatRoughness={0.2} />
          </mesh>
        </group>

        {/* Flame between slab and pan */}
        <mesh ref={flame} position={[0, 0.16, 0]} visible={false}>
          <coneGeometry args={[0.5, 0.3, 20, 1, true]} />
          <meshBasicMaterial color="#ff8c3a" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight ref={flameLight} position={[0, 0.35, 0.2]} intensity={0} distance={4.5} decay={1.7} color="#ff9a4a" />

        {/* Falling ingredients */}
        <group ref={drops}>
          <TomatoChunk position={[-0.25, 2.3, 0.05]} />
          <TomatoChunk position={[0.2, 2.3, -0.12]} />
          <TomatoChunk position={[0.02, 2.3, 0.18]} />
          <Garlic position={[-0.05, 2.3, -0.05]} scale={0.7} />
          <Garlic position={[0.32, 2.3, 0.1]} scale={0.6} />
        </group>

        <SteamEmitter position={[0, 0.5, 0]} window={[0.635, 0.66, 0.71, 0.78]} count={10} spread={0.5} rise={1.4} />
        <BasilPot position={[-0.95, 0.2, 0.55]} scale={0.8} />
      </group>

      {/* ---- The finished dish ---- */}
      <group ref={dish} position={[0, 1.12, 0]} scale={0.001} visible={false}>
        {/* Ceramic plate */}
        <mesh>
          <cylinderGeometry args={[1.02, 0.82, 0.07, 56]} />
          <meshPhysicalMaterial color="#f3ece1" roughness={0.22} clearcoat={0.95} clearcoatRoughness={0.12} />
        </mesh>
        <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.94, 0.045, 14, 56]} />
          <meshPhysicalMaterial color="#faf5ec" roughness={0.2} clearcoat={1} />
        </mesh>

        {/* Pasta nest */}
        <group ref={pasta} position={[0, 0.16, 0]} scale={0.001}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.085, 14, 48]} />
            <meshPhysicalMaterial color="#eed7a3" roughness={0.48} clearcoat={0.35} />
          </mesh>
          <mesh rotation={[Math.PI / 2.15, 0.5, 0.3]} position={[0.03, 0.07, -0.02]}>
            <torusGeometry args={[0.37, 0.075, 14, 44]} />
            <meshPhysicalMaterial color="#f0d9a8" roughness={0.48} clearcoat={0.35} />
          </mesh>
          <mesh rotation={[Math.PI / 1.9, -0.4, -0.2]} position={[-0.04, 0.13, 0.03]}>
            <torusGeometry args={[0.24, 0.065, 12, 40]} />
            <meshPhysicalMaterial color="#ecd096" roughness={0.5} clearcoat={0.35} />
          </mesh>
        </group>

        {/* Sauce pools */}
        {[[0.28, 0.2, -0.1, 0.13], [-0.3, 0.19, 0.12, 0.11], [0.02, 0.21, 0.3, 0.09]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.45, 1]}>
            <sphereGeometry args={[r, 20, 20]} />
            <meshPhysicalMaterial color="#b8402a" roughness={0.24} clearcoat={0.9} clearcoatRoughness={0.18} />
          </mesh>
        ))}

        {/* Basil + parmesan finish */}
        <BasilPot position={[-0.12, 0.3, 0.05]} scale={0.42} />
        {Array.from({ length: 26 }, (_, i) => {
          const a = i * 2.39996;
          const r = 0.12 + (i % 5) * 0.09;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.26 + (i % 3) * 0.02, Math.sin(a) * r]} rotation={[i, i * 0.7, 0]}>
              <boxGeometry args={[0.03, 0.008, 0.03]} />
              <meshPhysicalMaterial color="#f7f2e6" roughness={0.4} />
            </mesh>
          );
        })}

        <SteamEmitter position={[0, 0.45, 0]} window={[0.78, 0.81, 0.97, 1.01]} count={12} spread={0.55} rise={1.7} />
      </group>
    </>
  );
};
