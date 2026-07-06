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
            Math.cos(a) * 2.35,
            Math.sin(a) * 1.75,
            Math.sin(a * 1.7) * 0.7,
          ),
        };
      }),
    [],
  );
}

/** Deterministic starfield around the graph — quiet depth, no randomness at
 *  render time (index-hashed positions), so it never flickers between mounts. */
function StarDust({ count = 260 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // index-based pseudo-random (mulberry-ish), deterministic
      const r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin(i * 78.233) * 12578.1459) % 1;
      const r3 = Math.abs(Math.sin(i * 39.425) * 26251.7331) % 1;
      const radius = 3.4 + r1 * 3.6;
      const theta = r2 * Math.PI * 2;
      const phi = Math.acos(2 * r3 - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.75;
      arr[i * 3 + 2] = radius * Math.cos(phi) * 0.8 - 1.2;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#8b9dc9"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

/** Two slow, tilted orbit rings around the brand core. */
function OrbitRings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (a.current) a.current.rotation.z = t * 0.12;
    if (b.current) b.current.rotation.z = -t * 0.09;
  });
  return (
    <>
      <mesh ref={a} rotation={[Math.PI / 2.4, 0.4, 0]}>
        <torusGeometry args={[0.95, 0.006, 8, 96]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.45} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 1.9, -0.5, 0.6]}>
        <torusGeometry args={[1.25, 0.004, 8, 96]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} />
      </mesh>
    </>
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
    ref.current.scale.setScalar(0.06 + fade * 0.06);
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
      {primary && (
        // soft halo behind the core
        <mesh>
          <sphereGeometry args={[0.72, 24, 24]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.08} />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[primary ? 0.5 : 0.21, 32, 32]} />
        <meshStandardMaterial
          color={primary ? "#6366f1" : "#0f1a2e"}
          emissive={primary ? "#6366f1" : "#22d3ee"}
          emissiveIntensity={primary ? 0.8 : 0.5}
          roughness={0.3}
          metalness={0.15}
        />
      </mesh>
      <Html
        center
        distanceFactor={8}
        // bottom-most node keeps its label below itself so it doesn't crowd
        // the central "Your Brand" pill
        position={[0, primary ? -0.95 : pos.y < -1 ? -0.52 : 0.48, 0]}
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

function Scene({ brandLabel }: { brandLabel: string }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useNodes();
  useFrame((state) => {
    if (!group.current) return;
    // slow ambient drift + pointer parallax
    const drift = Math.sin(state.clock.elapsedTime * 0.1) * 0.08;
    group.current.rotation.y +=
      (state.pointer.x * 0.45 + drift - group.current.rotation.y) * 0.04;
    group.current.rotation.x +=
      (-state.pointer.y * 0.3 - group.current.rotation.x) * 0.04;
  });
  return (
    <group ref={group}>
      <StarDust />
      <OrbitRings />
      {nodes.map((n, i) => (
        <group key={n.label}>
          <Line
            points={[CENTER, n.pos]}
            color="#6366f1"
            lineWidth={1.2}
            transparent
            opacity={0.35}
          />
          <Pulse to={n.pos} offset={i / ENGINES.length} />
        </group>
      ))}
      <Node pos={CENTER} label={brandLabel} primary />
      {nodes.map((n) => (
        <Node key={n.label} pos={n.pos} label={n.label} />
      ))}
    </group>
  );
}

export default function KnowledgeGraph3D({
  brandLabel = "Your Brand",
}: {
  brandLabel?: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.9], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 4, 6]} intensity={44} color="#22d3ee" />
      <pointLight position={[-5, -3, 4]} intensity={30} color="#6366f1" />
      <Scene brandLabel={brandLabel} />
    </Canvas>
  );
}
