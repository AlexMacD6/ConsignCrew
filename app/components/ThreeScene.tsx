"use client";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Float } from "@react-three/drei";
import * as THREE from "three";

// WebGL Support Detection Utility
const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", {
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
        antialias: false,
        alpha: true,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        logarithmicDepthBuffer: false,
      }) ||
      canvas.getContext("webgl", {
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
        antialias: false,
        alpha: true,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
      });

    if (!gl) {
      console.warn("WebGL not supported");
      return false;
    }

    return true;
  } catch (error) {
    console.error("WebGL support check failed:", error);
    return false;
  }
};

// Optimized Floating Box Component
function FloatingBox({
  position,
  color,
  size = 1,
  logoTexture,
  index,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  logoTexture?: THREE.Texture;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPosition = useMemo(() => [...position], []);
  const animationOffset = useMemo(() => index * 0.5, [index]);

  useFrame((state) => {
    if (meshRef.current) {
      // Use continuous time without modulo to prevent sudden jumps
      const time = state.clock.elapsedTime + animationOffset;

      // Smoother, more subtle animations
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
      meshRef.current.rotation.y = Math.sin(time * 0.2) * 0.2;
      meshRef.current.position.y =
        initialPosition[1] + Math.sin(time * 0.4) * 0.3;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          metalness={0.1}
          roughness={0.3}
        />

        {/* Simplified logo display */}
        {logoTexture && (
          <mesh position={[0, 0, size / 2 + 0.01]}>
            <planeGeometry args={[size * 0.7, size * 0.35]} />
            <meshBasicMaterial
              map={logoTexture}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </mesh>
    </Float>
  );
}

// Optimized Particle System with fewer particles
function ParticleSystem({ count = 200 }: { count?: number }) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.005 + Math.random() * 0.01; // Slower speed
      const x = Math.random() * 1000 - 500; // Smaller range
      const y = Math.random() * 1000 - 500;
      const z = Math.random() * 1000 - 500;
      temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);

  const points = useRef<THREE.Points>(null);
  const positions = useMemo(
    () => new Float32Array(particles.length * 3),
    [particles.length]
  );

  useFrame((state) => {
    if (points.current) {
      particles.forEach((particle, i) => {
        const { factor, speed, x, y, z } = particle;
        // Use continuous time without modulo
        const t = state.clock.elapsedTime * speed + factor;

        positions[i * 3] = x + Math.sin(t) * 30;
        positions[i * 3 + 1] = y + Math.cos(t) * 30;
        positions[i * 3 + 2] = z + Math.sin(t) * 30;
      });

      if (points.current.geometry.attributes.position) {
        points.current.geometry.attributes.position.array = positions;
        points.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        color="#D4AF3D"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Main Scene Component
function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);

  // Load the logo texture with proper cleanup
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    let mounted = true;

    textureLoader.load(
      "/TreasureHub Centered.png",
      (texture) => {
        if (mounted) {
          setLogoTexture(texture);
        }
      },
      undefined,
      (error) => {
        console.warn("Failed to load logo texture:", error);
        if (mounted) {
          setLogoTexture(null);
        }
      }
    );

    return () => {
      mounted = false;
      if (logoTexture) {
        logoTexture.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Smoother rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  // Reduced number of floating boxes for better performance
  const floatingBoxes = useMemo(
    () => [
      {
        position: [-5, 2, -5] as [number, number, number],
        color: "#D4AF3D",
        size: 1.5,
        index: 0,
      },
      {
        position: [5, -2, 3] as [number, number, number],
        color: "#825E08",
        size: 1,
        index: 1,
      },
      {
        position: [0, 5, -8] as [number, number, number],
        color: "#D4AF3D",
        size: 0.8,
        index: 2,
      },
      {
        position: [-8, -3, 0] as [number, number, number],
        color: "#825E08",
        size: 1.2,
        index: 3,
      },
      {
        position: [8, 1, -3] as [number, number, number],
        color: "#D4AF3D",
        size: 0.6,
        index: 4,
      },
      {
        position: [-3, -5, 5] as [number, number, number],
        color: "#825E08",
        size: 1.3,
        index: 5,
      },
      {
        position: [3, 4, 8] as [number, number, number],
        color: "#D4AF3D",
        size: 0.9,
        index: 6,
      },
      {
        position: [-10, 0, -10] as [number, number, number],
        color: "#825E08",
        size: 1.1,
        index: 7,
      },
      {
        position: [12, 3, -6] as [number, number, number],
        color: "#D4AF3D",
        size: 1.4,
        index: 8,
      },
      {
        position: [-12, -1, 7] as [number, number, number],
        color: "#825E08",
        size: 0.7,
        index: 9,
      },
    ],
    []
  );

  return (
    <group ref={groupRef}>
      {/* Ambient Light */}
      <ambientLight intensity={0.4} />

      {/* Directional Light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Point Light */}
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#D4AF3D" />

      {/* Stars Background */}
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Optimized Particle System */}
      <ParticleSystem count={300} />

      {/* Floating Boxes */}
      {floatingBoxes.map((box, index) => (
        <FloatingBox
          key={index}
          position={box.position}
          color={box.color}
          size={box.size}
          logoTexture={logoTexture || undefined}
          index={box.index}
        />
      ))}

      {/* Simplified Background Elements */}
      <mesh position={[-15, 0, -15]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial
          color="#D4AF3D"
          transparent
          opacity={0.05}
          wireframe
        />
      </mesh>

      <mesh position={[15, 0, 15]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[6, 6, 6]} />
        <meshStandardMaterial
          color="#825E08"
          transparent
          opacity={0.05}
          wireframe
        />
      </mesh>
    </group>
  );
}

// Simple Error Fallback - Just background color
function ErrorFallback() {
  return <div className="w-full h-full bg-[#f9fafb]" />;
}

// Main ThreeScene Component with Enhanced Performance
export default function ThreeScene() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  const resetScene = useCallback(() => {
    console.log("Resetting 3D scene...");
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);

    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  }, []);

  useEffect(() => {
    const isWebGLSupported = checkWebGLSupport();
    setWebglSupported(isWebGLSupported);

    if (!isWebGLSupported) {
      console.warn("WebGL not supported, showing fallback");
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const handleError = (error: ErrorEvent) => {
      console.error("Three.js error:", error);
      setHasError(true);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("WebGL context lost");
      setHasError(true);

      // Don't retry automatically to prevent the sad face from appearing
      if (retryCount < 2) {
        setTimeout(() => {
          if (!hasError) {
            resetScene();
          }
        }, 2000);
      } else {
        setWebglSupported(false);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("webglcontextlost", handleContextLost);

    const timer = setTimeout(() => setIsLoading(false), 100);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("webglcontextlost", handleContextLost);
      clearTimeout(timer);
    };
  }, [retryCount, resetScene]);

  if (webglSupported === false || hasError) {
    // Return a clean fallback without any Three.js artifacts
    return <ErrorFallback />;
  }

  if (isLoading || webglSupported === null) {
    return <ErrorFallback />;
  }

  return (
    <div className="w-full h-full bg-[#f9fafb] relative overflow-hidden">
      <Canvas
        key={`canvas-${retryCount}`}
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: "#f9fafb" }}
        onError={(error) => {
          console.error("Canvas error:", error);
          // Prevent the sad face by immediately showing our fallback
          setWebglSupported(false);
          setHasError(true);
        }}
        gl={{
          powerPreference: "default",
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          logarithmicDepthBuffer: false,
        }}
        onCreated={({ gl }) => {
          console.log("WebGL context created successfully");
          gl.setClearColor("#f9fafb", 1);

          // Prevent the default Three.js sad face from appearing
          gl.canvas.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              console.warn("WebGL context lost, preventing default sad face");
              setHasError(true);
            },
            false
          );

          gl.canvas.addEventListener(
            "webglcontextrestored",
            () => {
              console.log("WebGL context restored");
              setHasError(false);
            },
            false
          );
        }}
      >
        <Scene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
