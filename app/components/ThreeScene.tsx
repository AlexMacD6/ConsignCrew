"use client";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Float } from "@react-three/drei";
import * as THREE from "three";

// Floating Box Component with Logo Texture
function FloatingBox({
  position,
  color,
  size = 1,
  logoTexture,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  logoTexture?: THREE.Texture;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Use modulo to create looping animations that don't grow infinitely
      const time = state.clock.elapsedTime % (Math.PI * 2);

      // Apply rotation to the entire group instead of individual meshes
      meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.3;
      meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.5;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Main box with logo as a child */}
        <mesh ref={meshRef} position={position}>
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.95}
            metalness={0.1}
            roughness={0.2}
          />

          {/* Logo as a child of the box - positioned relative to box center */}
          <mesh position={[0, 0, size / 2 + 0.01]}>
            <planeGeometry args={[size * 0.8, size * 0.4]} />
            <meshBasicMaterial
              color={logoTexture ? undefined : "#D4AF3D"}
              map={logoTexture}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        </mesh>
      </group>
    </Float>
  );
}

// Particle System Component
function ParticleSystem({ count = 500 }: { count?: number }) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() * 0.02;
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;
      temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);

  const points = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (points.current) {
      particles.forEach((particle, i) => {
        const { factor, speed, x, y, z } = particle;
        // Use modulo to prevent infinite growth
        const t = (state.clock.elapsedTime * speed + factor) % 100;

        if (points.current && points.current.geometry.attributes.position) {
          const positions = points.current.geometry.attributes.position
            .array as Float32Array;
          positions[i * 3] = x + Math.sin(t) * 50;
          positions[i * 3 + 1] = y + Math.cos(t) * 50;
          positions[i * 3 + 2] = z + Math.sin(t) * 50;
        }
      });
      points.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
          args={[new Float32Array(particles.length * 3), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#D4AF3D"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Main Scene Component
function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);
  const [textureError, setTextureError] = useState(false);

  // Load the logo texture with error handling
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/TreasureHub Centered.png",
      (texture) => {
        setLogoTexture(texture);
        setTextureError(false);
      },
      undefined,
      (error) => {
        console.warn("Failed to load logo texture:", error);
        setTextureError(true);
        setLogoTexture(null);
      }
    );

    // Cleanup function
    return () => {
      if (logoTexture) {
        logoTexture.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Use modulo to create a looping rotation
      const time = state.clock.elapsedTime % (Math.PI * 2);
      groupRef.current.rotation.y = time * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ambient Light */}
      <ambientLight intensity={0.4} />

      {/* Directional Light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Point Light */}
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#D4AF3D" />

      {/* Stars Background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Particle System */}
      <ParticleSystem count={800} />

      {/* Floating Boxes - render regardless of texture status */}
      <FloatingBox
        position={[-5, 2, -5]}
        color="#D4AF3D"
        size={1.5}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[5, -2, 3]}
        color="#825E08"
        size={1}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[0, 5, -8]}
        color="#D4AF3D"
        size={0.8}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-8, -3, 0]}
        color="#825E08"
        size={1.2}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[8, 1, -3]}
        color="#D4AF3D"
        size={0.6}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-3, -5, 5]}
        color="#825E08"
        size={1.3}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[3, 4, 8]}
        color="#D4AF3D"
        size={0.9}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-10, 0, -10]}
        color="#825E08"
        size={1.1}
        logoTexture={logoTexture || undefined}
      />

      {/* Additional floating boxes for better visibility */}
      <FloatingBox
        position={[12, 3, -6]}
        color="#D4AF3D"
        size={1.4}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-12, -1, 7]}
        color="#825E08"
        size={0.7}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[6, 6, 12]}
        color="#D4AF3D"
        size={1.0}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-6, -6, -12]}
        color="#825E08"
        size={1.6}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[15, 0, 0]}
        color="#D4AF3D"
        size={0.8}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-15, 4, 4]}
        color="#825E08"
        size={1.2}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[0, -8, 15]}
        color="#D4AF3D"
        size={0.9}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[9, -4, -9]}
        color="#825E08"
        size={1.1}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-9, 7, 9]}
        color="#D4AF3D"
        size={0.7}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[4, -7, -4]}
        color="#825E08"
        size={1.3}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-4, 8, 2]}
        color="#D4AF3D"
        size={0.6}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[11, -5, 8]}
        color="#825E08"
        size={1.0}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-11, 2, -8]}
        color="#D4AF3D"
        size={1.4}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[7, 9, -2]}
        color="#825E08"
        size={0.8}
        logoTexture={logoTexture || undefined}
      />
      <FloatingBox
        position={[-7, -9, 2]}
        color="#D4AF3D"
        size={1.1}
        logoTexture={logoTexture || undefined}
      />

      {/* Large Background Boxes */}
      <mesh position={[-15, 0, -15]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial
          color="#D4AF3D"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>

      <mesh position={[15, 0, 15]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial
          color="#825E08"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </group>
  );
}

// Error Boundary Component
function ErrorFallback({ onReset }: { onReset?: () => void }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#f9fafb] to-[#f3f4f6] flex items-center justify-center">
      <div className="text-gray-800 text-center max-w-md mx-auto px-6">
        <div className="mb-6">
          <img
            src="/TreasureHub - Logo.png"
            alt="TreasureHub"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2 text-gray-900">TreasureHub</h2>
          <p className="text-gray-600">
            Turn clutter into cash without the headaches
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
          <p className="text-gray-500 text-sm mb-4">
            3D background temporarily unavailable
          </p>
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-treasure-500 text-gray-900 font-medium rounded-lg hover:bg-treasure-600 transition-colors"
            >
              Retry 3D Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main ThreeScene Component with Error Handling
export default function ThreeScene() {
  const [hasError, setHasError] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetScene = useCallback(() => {
    console.log("Resetting 3D scene...");
    setHasError(false);
    setContextLost(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);

    // Force a re-render by updating the key
    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  }, []);

  useEffect(() => {
    // Enhanced WebGL support detection
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl");

        if (!gl) {
          console.warn(
            "WebGL not supported, falling back to static background"
          );
          setWebglSupported(false);
          setHasError(true);
          return false;
        }

        // Test WebGL capabilities
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          console.log("WebGL Renderer:", renderer);
        }

        setWebglSupported(true);
        return true;
      } catch (error) {
        console.error("Error checking WebGL support:", error);
        setWebglSupported(false);
        setHasError(true);
        return false;
      }
    };

    const handleError = (error: ErrorEvent) => {
      console.error("Three.js error:", error);

      // Check if it's a WebGL context creation error
      if (
        error.message &&
        error.message.includes("WebGL context could not be created")
      ) {
        console.warn(
          "WebGL context creation failed, falling back to static background"
        );
        setWebglSupported(false);
        setHasError(true);
        return;
      }

      setHasError(true);
    };

    const handleContextLost = (event: Event) => {
      console.warn("WebGL context lost, attempting to reset 3D scene");
      setContextLost(true);

      // Attempt to reset after a short delay
      setTimeout(() => {
        if (retryCount < 3) {
          resetScene();
        } else {
          setWebglSupported(false);
          setHasError(true);
        }
      }, 1000);
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored");
      setContextLost(false);
      setHasError(false);
    };

    // Check WebGL support first
    const isWebGLSupported = checkWebGLSupport();

    // Listen for console messages to detect context loss
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.warn = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("THREE.WebGLRenderer: Context Lost") ||
        message.includes("WebGL context could not be created")
      ) {
        console.log("Detected WebGL context loss via console message");
        handleContextLost(new Event("webglcontextlost"));
      }
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("WebGL context could not be created") ||
        message.includes("Failed to create WebGL2RenderingContext")
      ) {
        console.warn(
          "WebGL context creation failed, falling back to static background"
        );
        setWebglSupported(false);
        setHasError(true);
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("webglcontextlost", handleContextLost);
    window.addEventListener("webglcontextrestored", handleContextRestored);

    // Set loading to false after a short delay
    const timer = setTimeout(() => setIsLoading(false), 100);

    return () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      window.removeEventListener("error", handleError);
      window.removeEventListener("webglcontextlost", handleContextLost);
      window.removeEventListener("webglcontextrestored", handleContextRestored);
      clearTimeout(timer);
    };
  }, [retryCount, resetScene]);

  if (hasError || contextLost) {
    return <ErrorFallback onReset={retryCount < 3 ? resetScene : undefined} />;
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#f9fafb] flex items-center justify-center">
        <div className="text-gray-800 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-treasure-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#f9fafb]">
      <Canvas
        key={`canvas-${retryCount}`}
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: "#f9fafb" }}
        onError={(error) => {
          console.error("Canvas error:", error);
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
          preserveDrawingBuffer: false,
          logarithmicDepthBuffer: false,
        }}
        onCreated={({ gl }) => {
          console.log("WebGL context created successfully");
          gl.setClearColor("#f9fafb", 1);
        }}
      >
        <Scene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
