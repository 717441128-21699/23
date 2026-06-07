import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { DomainStructure } from '@/types';

interface DomainVisualizerProps {
  domainData?: DomainStructure;
  deviceLength?: number;
  deviceWidth?: number;
  deviceThickness?: number;
  gridX?: number;
  gridY?: number;
  gridZ?: number;
  timeIndex?: number;
  mockSeed?: number;
}

function valueToColor(mz: number): THREE.Color {
  const t = Math.max(-1, Math.min(1, mz));
  if (t < 0) {
    const k = -t;
    return new THREE.Color().setRGB(0.02 * k, 0.25 * k, 0.7 * k + 0.1);
  }
  if (t < 0.5) {
    const k = t * 2;
    return new THREE.Color().setRGB(0.03 + 0.6 * k, 0.7 + 0.05 * k, 0.85 - 0.35 * k);
  }
  const k = (t - 0.5) * 2;
  return new THREE.Color().setRGB(0.63 + 0.3 * k, 0.75 - 0.1 * k, 0.5 - 0.45 * k);
}

function DomainMesh({
  gridX,
  gridY,
  gridZ,
  cellSize,
  mockSeed,
}: {
  gridX: number;
  gridY: number;
  gridZ: number;
  cellSize: THREE.Vector3;
  mockSeed: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { colors, count } = useMemo(() => {
    const total = gridX * gridY * gridZ;
    const colorArr = new Float32Array(total * 3);
    for (let z = 0; z < gridZ; z++) {
      for (let y = 0; y < gridY; y++) {
        for (let x = 0; x < gridX; x++) {
          const idx = (z * gridY + y) * gridX + x;
          const cx = gridX / 2;
          const cy = gridY / 2;
          const dx = (x - cx) / (gridX / 3);
          const dy = (y - cy) / (gridY / 3);
          const r = Math.sqrt(dx * dx + dy * dy);
          const mz = Math.cos(r * 1.8 + mockSeed) * Math.exp(-r * 0.4) +
            Math.sin(x * 0.3 + y * 0.2 + mockSeed * 2) * 0.2;
          const color = valueToColor(mz);
          colorArr[idx * 3] = color.r;
          colorArr[idx * 3 + 1] = color.g;
          colorArr[idx * 3 + 2] = color.b;
        }
      }
    }
    return { colors: colorArr, count: total };
  }, [gridX, gridY, gridZ, mockSeed]);

  useMemo(() => {
    if (!meshRef.current) return;
    let i = 0;
    for (let z = 0; z < gridZ; z++) {
      for (let y = 0; y < gridY; y++) {
        for (let x = 0; x < gridX; x++) {
          dummy.position.set(
            (x - gridX / 2 + 0.5) * cellSize.x,
            (y - gridY / 2 + 0.5) * cellSize.y,
            (z - gridZ / 2 + 0.5) * cellSize.z
          );
          dummy.scale.set(
            cellSize.x * 0.95,
            cellSize.y * 0.95,
            cellSize.z * 0.95
          );
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i++, dummy.matrix);
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [gridX, gridY, gridZ, cellSize, dummy]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const colorAttr = meshRef.current.instanceColor;
    if (!colorAttr) return;
    for (let z = 0; z < gridZ; z++) {
      for (let y = 0; y < gridY; y++) {
        for (let x = 0; x < gridX; x++) {
          const idx = (z * gridY + y) * gridX + x;
          const cx = gridX / 2;
          const cy = gridY / 2;
          const dx = (x - cx) / (gridX / 3);
          const dy = (y - cy) / (gridY / 3);
          const r = Math.sqrt(dx * dx + dy * dy);
          const mz = Math.cos(r * 1.8 + mockSeed + time * 0.3) * Math.exp(-r * 0.4);
          const color = valueToColor(mz);
          colorAttr.setXYZ(idx, color.r, color.g, color.b);
        }
      }
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshStandardMaterial vertexColors toneMapped={false} roughness={0.6} metalness={0.1} />
    </instancedMesh>
  );
}

export default function DomainVisualizer({
  deviceLength = 200,
  deviceWidth = 100,
  deviceThickness = 5,
  gridX = 20,
  gridY = 10,
  gridZ = 2,
  mockSeed = 0,
}: DomainVisualizerProps) {
  const scale = 0.02;
  const cellSize = useMemo(() => new THREE.Vector3(
    (deviceLength / gridX) * scale,
    (deviceWidth / gridY) * scale,
    (deviceThickness / gridZ) * scale
  ), [deviceLength, deviceWidth, deviceThickness, gridX, gridY, gridZ, scale]);

  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas
        camera={{ position: [3, 2, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0A1628']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#3B82F6" />
        <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#8B5CF6" />
        <Environment preset="night" />

        <DomainMesh
          gridX={gridX}
          gridY={gridY}
          gridZ={gridZ}
          cellSize={cellSize}
          mockSeed={mockSeed}
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={1.5}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.5}
        />

        <EffectComposer>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
