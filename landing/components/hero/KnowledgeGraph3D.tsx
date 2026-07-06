"use client";

import { Html, Line } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Copilot"];
const CENTER = new THREE.Vector3(0, 0, 0);

function useNodes() {
  return useMemo(
    () =>
      ENGINES.map((label, i) => {
        const a = (i / ENGINES.length) * Math.PI * 2 - Math.PI / 2;
        return {
          label,
          pos: new THREE.Vector3(
            Math.cos(a) * 2.7,
            Math.sin(a) * 1.9,
            Math.sin(a * 1.7) * 0.7,
          ),
        };
      }),
    [],
  );
}

/** A light pulse that travels along an edge from an AI engine toward the brand. */
function Pulse({ to, offset }: { to: THREE.Vector3; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.32 + offset) % 1;
    ref.current.position.lerpVectors(to, CENTER, t);
    const fade = Math.sin(t * Math.PI);
    ref.current.scale.setScalar(0.05 + fade * 0.05);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + fade * 0.85;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#22d3ee" transparent />
    </mesh>
  );
}

function Node({
  pos,
  label,
  primary = false,
}: {
  pos: THREE.Vector3;
  label: string;
  primary?: boolean;
}) {
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[primary ? 0.4 : 0.15, 32, 32]} />
        <meshStandardMaterial
          color={primary ? "#6366f1" : "#0f1a2e"}
          emissive={primary ? "#6366f1" : "#22d3ee"}
          emissiveIntensity={primary ? 0.7 : 0.4}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      <Html
        center
        distanceFactor={8}
        position={[0, primary ? -0.78 : 0.42, 0]}
        className="pointer-events-none select-none"
      >
        <div
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] ${
            primary
              ? "border-indigo/50 bg-base/80 font-semibold text-ink"
              : "border-line bg-base/70 text-muted"
          }`}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  const nodes = useNodes();
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y +=
      (state.pointer.x * 0.4 - group.current.rotation.y) * 0.04;
    group.current.rotation.x +=
      (-state.pointer.y * 0.28 - group.current.rotation.x) * 0.04;
  });
  return (
    <group ref={group}>
      {nodes.map((n, i) => (
        <group key={n.label}>
          <Line
            points={[CENTER, n.pos]}
            color="#6366f1"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
          <Pulse to={n.pos} offset={i / ENGINES.length} />
        </group>
      ))}
      <Node pos={CENTER} label="Your Brand" primary />
      {nodes.map((n) => (
        <Node key={n.label} pos={n.pos} label={n.label} />
      ))}
    </group>
  );
}

export default function KnowledgeGraph3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 4, 6]} intensity={40} color="#22d3ee" />
      <pointLight position={[-5, -3, 4]} intensity={28} color="#6366f1" />
      <Scene />
    </Canvas>
  );
}
