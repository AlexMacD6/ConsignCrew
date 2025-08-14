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

// Simplified Floating Box Component with reduced complexity
function FloatingBox({
  position,
  color,
  size = 1,
  index,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPosition = useMemo(() => [...position], []);
  const animationOffset = useMemo(() => index * 0.5, [index]);

  useFrame((state) => {
    if (meshRef.current) {
      // Simplified animations to reduce GPU load
      const time = state.clock.elapsedTime + animationOffset;

      // Reduced animation intensity
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      meshRef.current.rotation.y = Math.sin(time * 0.15) * 0.1;
      meshRef.current.position.y =
        initialPosition[1] + Math.sin(time * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
}

// Simplified Particle System with reduced count
function ParticleSystem({ count = 150 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.3;
    }

    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      // Simplified particle movement
      points.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Simplified Scene Component
function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  // Reduced number of floating boxes for better performance
  const floatingBoxes = useMemo(
    () => [
      {
        position: [-8, 2, -5] as [number, number, number],
        color: "#D4AF3D",
        size: 0.8,
        index: 0,
      },
      {
        position: [6, -1, -3] as [number, number, number],
        color: "#825E08",
        size: 0.6,
        index: 1,
      },
      {
        position: [-4, 3, 8] as [number, number, number],
        color: "#B8860B",
        size: 0.7,
        index: 2,
      },
      {
        position: [8, -2, 6] as [number, number, number],
        color: "#DAA520",
        size: 0.5,
        index: 3,
      },
    ],
    []
  );

  useFrame((state) => {
    if (groupRef.current) {
      // Very subtle group rotation
      groupRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ambient lighting for better performance */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />

      {/* Simplified Particle System */}
      <ParticleSystem count={150} />

      {/* Reduced Floating Boxes */}
      {floatingBoxes.map((box, index) => (
        <FloatingBox
          key={index}
          position={box.position}
          color={box.color}
          size={box.size}
          index={box.index}
        />
      ))}

      {/* Removed complex background elements for better performance */}
    </group>
  );
}

// Clean Error Fallback - Just background color, no error indicators
function ErrorFallback() {
  return <div className="w-full h-full bg-[#f9fafb]" />;
}

// Optimized Main ThreeScene Component
export default function ThreeScene() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Suppress Three.js error displays globally
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("WebGL") ||
        message.includes("Three.js") ||
        message.includes("context") ||
        message.includes("happy") ||
        message.includes("face") ||
        message.includes("sad")
      ) {
        // Suppress Three.js error displays
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("WebGL") ||
        message.includes("Three.js") ||
        message.includes("context") ||
        message.includes("happy") ||
        message.includes("face") ||
        message.includes("sad")
      ) {
        // Suppress Three.js warning displays
        return;
      }
      originalWarn.apply(console, args);
    };

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
      // Only set error if it's a critical WebGL error
      if (error.message && error.message.includes("WebGL")) {
        setHasError(true);
      }
    };

    const handleContextLost = (event: Event) => {
      try {
        event.preventDefault();
        console.warn("WebGL context lost");
        setHasError(true);

        // Reduced retry attempts to prevent context thrashing
        if (retryCount < 1) {
          setTimeout(() => {
            // Reset scene logic inline to avoid dependency issues
            console.log("Resetting 3D scene...");
            setHasError(false);
            setIsLoading(true);
            setRetryCount((prev) => prev + 1);
            setTimeout(() => setIsLoading(false), 200);
          }, 3000); // Increased delay
        } else {
          setWebglSupported(false);
        }
      } catch (error) {
        console.error("Error handling context lost:", error);
        setHasError(true);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("webglcontextlost", handleContextLost);

    const timer = setTimeout(() => setIsLoading(false), 100);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("webglcontextlost", handleContextLost);
      clearTimeout(timer);
      // Restore original console functions
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [retryCount]);

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
          // Only set error for critical WebGL issues
          if (error && typeof error === "object" && "message" in error) {
            const errorMessage = String(error.message);
            if (
              errorMessage.includes("WebGL") ||
              errorMessage.includes("context")
            ) {
              setWebglSupported(false);
              setHasError(true);
            }
          }
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
          try {
            console.log("WebGL context created successfully");
            gl.setClearColor("#f9fafb", 1);

            // Enhanced context loss prevention
            const canvas = gl.domElement;
            if (canvas && canvas.addEventListener) {
              canvas.addEventListener(
                "webglcontextlost",
                (event: Event) => {
                  event.preventDefault();
                  console.warn(
                    "WebGL context lost, preventing default displays"
                  );
                  setHasError(true);
                },
                false
              );

              canvas.addEventListener(
                "webglcontextrestored",
                () => {
                  console.log("WebGL context restored");
                  setHasError(false);
                },
                false
              );

              // Prevent any Three.js error displays on the canvas
              canvas.style.pointerEvents = "none";
              canvas.addEventListener(
                "error",
                (e: Event) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                true
              );
            } else {
              console.warn("Canvas not available, skipping event listeners");
            }
          } catch (error) {
            console.error("Error in onCreated:", error);
            // Don't set error state here, let the scene try to work
          }
        }}
      >
        <Scene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.2}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
