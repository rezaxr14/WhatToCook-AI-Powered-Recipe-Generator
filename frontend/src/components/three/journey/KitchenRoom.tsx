import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey, seg } from './state';
import { Tomato, Egg, CheeseWedge, BasilPot, MilkCarton, Garlic, Onion, BellPepper, Lemon, Carrot, Mushroom } from './Ingredients';
import { SteamEmitter } from './Effects';

/**
 * Chapter I environment: a dark, cinematic kitchen. The refrigerator is the
 * centerpiece — its door swings open as the camera approaches (scroll 0.12–0.20)
 * spilling warm light across the room. The whole room sinks into darkness for
 * the middle chapters and rises again, bright and warm, for the finale.
 */
export const KitchenRoom: React.FC = () => {
  const room = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const fridgeLight = useRef<THREE.PointLight>(null);
  const bulb1 = useRef<THREE.PointLight>(null);
  const bulb2 = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const p = journey.progress;
    const g = room.current;
    if (!g) return;

    // Room sinks away for the AI/galaxy chapters, returns for the finale.
    const sink = seg(p, 0.3, 0.385) * (1 - seg(p, 0.875, 0.95));
    g.position.y = -sink * 9.5;
    g.visible = sink < 0.999;

    // Fridge door: opens on approach, closes again for the finale.
    const open = seg(p, 0.12, 0.2) * (1 - seg(p, 0.9, 0.97));
    if (door.current) door.current.rotation.y = -open * 1.95;

    // Interior fridge light spills out with the door.
    if (fridgeLight.current) fridgeLight.current.intensity = open * 3.2;

    // Warm pendant pools of light — brighter once home again.
    const warmth = 0.85 + seg(p, 0.88, 0.96) * 0.9;
    const flicker = 0.94 + Math.sin(clock.elapsedTime * 9.3) * 0.03 + Math.sin(clock.elapsedTime * 23.7) * 0.02;
    if (bulb1.current) bulb1.current.intensity = 3.4 * warmth * flicker;
    if (bulb2.current) bulb2.current.intensity = 2.8 * warmth * (2 - flicker);
  });

  return (
    <group ref={room}>
      {/* Floor — warm walnut catching pools of light */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[26, 48]} />
        <meshPhysicalMaterial color="#4a3624" roughness={0.28} clearcoat={0.5} clearcoatRoughness={0.3} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 5, -6.6]}>
        <planeGeometry args={[42, 12]} />
        <meshStandardMaterial color="#33271b" roughness={0.9} />
      </mesh>
      {/* Left wall hint */}
      <mesh position={[-9, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color="#2b2117" roughness={0.95} />
      </mesh>

      {/* Counter along the back */}
      <mesh position={[-0.6, 0.45, -3.3]}>
        <boxGeometry args={[6.6, 0.9, 1.25]} />
        <meshStandardMaterial color="#57422c" roughness={0.75} />
      </mesh>
      <mesh position={[-0.6, 0.94, -3.3]}>
        <boxGeometry args={[6.7, 0.07, 1.32]} />
        <meshPhysicalMaterial color="#7a6a55" roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.25} />
      </mesh>

      {/* Pot with gentle steam on the stove area */}
      <mesh position={[0.4, 1.12, -3.25]}>
        <cylinderGeometry args={[0.3, 0.27, 0.26, 28]} />
        <meshPhysicalMaterial color="#26262c" roughness={0.35} metalness={0.75} />
      </mesh>
      <mesh position={[0.4, 1.27, -3.25]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.018, 10, 32]} />
        <meshStandardMaterial color="#3a3a42" metalness={0.8} roughness={0.3} />
      </mesh>
      <SteamEmitter position={[0.4, 1.35, -3.25]} window={[0, 0.02, 0.28, 0.36]} count={9} rise={1.1} />

      {/* Hanging pendant lights above the counter */}
      {[-1.6, 0.2].map((x, i) => (
        <group key={i} position={[x, 0, -3.25]}>
          <mesh position={[0, 3.35, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 1.1, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 2.78, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.24, 0.22, 24, 1, true]} />
            <meshStandardMaterial color="#171512" roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 2.7, 0]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial color="#ffd9a0" emissive="#ffb45e" emissiveIntensity={3} />
          </mesh>
          <pointLight
            ref={i === 0 ? bulb1 : bulb2}
            position={[0, 2.62, 0]}
            intensity={3.2}
            distance={9.5}
            decay={1.45}
            color="#ffbe78"
          />
        </group>
      ))}

      {/* ============ THE REFRIGERATOR ============ */}
      <group position={[2.4, 0, -3.05]}>
        {/* Body — five panels, open at the front so the interior reads */}
        <mesh position={[0, 1.75, -0.525]}>
          <boxGeometry args={[1.7, 3.5, 0.1]} />
          <meshStandardMaterial color="#4d565e" roughness={0.45} metalness={0.25} />
        </mesh>
        <mesh position={[-0.8, 1.75, 0]}>
          <boxGeometry args={[0.1, 3.5, 1.15]} />
          <meshStandardMaterial color="#4d565e" roughness={0.45} metalness={0.25} />
        </mesh>
        <mesh position={[0.8, 1.75, 0]}>
          <boxGeometry args={[0.1, 3.5, 1.15]} />
          <meshStandardMaterial color="#4d565e" roughness={0.45} metalness={0.25} />
        </mesh>
        <mesh position={[0, 3.45, 0]}>
          <boxGeometry args={[1.7, 0.1, 1.15]} />
          <meshStandardMaterial color="#4d565e" roughness={0.45} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.7, 0.1, 1.15]} />
          <meshStandardMaterial color="#4d565e" roughness={0.45} metalness={0.25} />
        </mesh>

        {/* Interior cavity (visible when the door opens) */}
        <mesh position={[0, 1.75, 0.02]}>
          <boxGeometry args={[1.5, 3.28, 1.0]} />
          <meshStandardMaterial color="#f7efe2" emissive="#ffedc9" emissiveIntensity={0.7} side={THREE.BackSide} />
        </mesh>
        {/* Shelves */}
        {[0.85, 1.7, 2.5].map((y) => (
          <mesh key={y} position={[0, y, 0.02]}>
            <boxGeometry args={[1.44, 0.025, 0.92]} />
            <meshPhysicalMaterial color="#eef0f2" roughness={0.15} clearcoat={1} transparent opacity={0.85} />
          </mesh>
        ))}

        {/* Fridge contents — the cast of chapter II (models are base-origin) */}
        <BasilPot position={[0.02, 0.8625, 0.02]} scale={0.95} />
        <Garlic position={[-0.4, 0.8625, -0.1]} scale={0.85} />
        <Onion position={[-0.1, 0.8625, -0.26]} scale={0.75} />
        <BellPepper position={[0.42, 0.8625, 0.08]} scale={0.85} />
        <Tomato position={[-0.42, 1.7125, 0.06]} scale={0.65} />
        <Tomato position={[-0.14, 1.7125, -0.22]} scale={0.55} />
        <Mushroom position={[0.38, 1.7125, 0.0]} scale={0.78} />
        <Egg position={[-0.34, 2.5125, 0.22]} />
        <Egg position={[-0.08, 2.5125, 0.3]} scale={0.92} />
        <CheeseWedge position={[-0.62, 2.5125, 0.28]} scale={0.85} />
        <MilkCarton position={[0.42, 2.5125, -0.1]} rotation={[0, 0.4, 0]} scale={0.95} />

        {/* Door — hinged on the left edge */}
        <group ref={door} position={[-0.85, 1.75, 0.585]}>
          <mesh position={[0.85, 0, 0]}>
            <boxGeometry args={[1.68, 3.42, 0.09]} />
            <meshStandardMaterial color="#525b64" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[1.56, 0.15, 0.09]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.7, 10]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>

        <pointLight ref={fridgeLight} position={[0, 1.8, 0.4]} intensity={0} distance={6.5} decay={1.5} color="#ffedc9" />
      </group>

      {/* Scattered counter ingredients — the room feels used, alive */}
      <Lemon position={[-2.1, 0.975, -3.0]} scale={0.9} />
      <Carrot position={[-2.6, 0.975, -3.35]} scale={0.9} />
      <Tomato position={[-3.2, 0.975, -3.1]} scale={0.85} />
      <Garlic position={[-1.1, 0.975, -3.05]} scale={0.85} />

      {/* Finale-only: the finished meal waits on the counter */}
      <FinaleMeal />
    </group>
  );
};

/** A small plated dish that only appears during the bright return home. */
const FinaleMeal: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = journey.progress;
    const s = seg(p, 0.9, 0.955);
    g.scale.setScalar(Math.max(s, 0.001));
    g.visible = s > 0.001;
  });
  return (
    <group ref={ref} position={[-1.7, 1.0, -3.1]} scale={0.001}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.34, 0.28, 0.05, 36]} />
        <meshPhysicalMaterial color="#f3ece1" roughness={0.25} clearcoat={0.9} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <torusGeometry args={[0.2, 0.075, 12, 32]} />
        <meshPhysicalMaterial color="#f0d9a8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.15, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshPhysicalMaterial color="#b8402a" roughness={0.28} clearcoat={0.8} />
      </mesh>
      <SteamEmitter position={[0, 0.3, 0]} window={[0.93, 0.96, 1.01, 1.02]} count={6} rise={0.7} spread={0.15} />
    </group>
  );
};
