"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll } from "@react-three/drei";
import { useRef as useThreeRef } from "react";
import { Mesh, ShaderMaterial } from "three";
import * as THREE from "three";

interface TreasureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  treasureMapContent: React.ReactNode;
  index: number;
}

const TreasureCard: React.FC<TreasureCardProps> = ({
  title,
  description,
  icon,
  treasureMapContent,
  index,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="relative w-full h-80 cursor-pointer perspective-1000"
      style={{ pointerEvents: "auto", zIndex: 40, position: "relative" }}
      onClick={() => {
        console.log(
          "Card clicked!",
          title,
          "Current state:",
          isFlipped,
          "New state:",
          !isFlipped
        );
        setIsFlipped(!isFlipped);
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front of Card */}
        <motion.div
          className="absolute w-full h-full rounded-2xl p-8"
          style={{
            backfaceVisibility: "hidden",
            backgroundImage: "url('/treasure clue.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          animate={{ rotateY: isFlipped ? -180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="text-center h-full flex flex-col justify-center items-center">
            <div className="mb-6">{icon}</div>
          </div>
        </motion.div>

        {/* Back of Card */}
        <motion.div
          className="absolute w-full h-full rounded-2xl p-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundImage: "url('/treasure clue.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          animate={{ rotateY: isFlipped ? -180 : 180 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="text-center h-full flex flex-col justify-center">
            <h4 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              {title}
            </h4>
            <div className="text-gray-700 text-base lg:text-lg mb-6">
              {treasureMapContent}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

function SandWaves({ progress }: { progress: number }) {
  const mesh = useThreeRef<Mesh>(null);
  const material = useThreeRef<ShaderMaterial>(null);
  const { clock } = useThree();

  // Vertex shader with dynamic sand movement
  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    
    varying vec2 vUv;
    varying float vAlpha;
    varying vec3 vPosition;
    
    // Improved noise function for more realistic sand movement
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
              // Create wind-like movement with stronger horizontal drift
     float windEffect(vec2 pos, float time) {
       float wind1 = noise(pos * 0.3 + vec2(time * 1.0, time * 0.5)) * 0.5;
       float wind2 = noise(pos * 0.6 + vec2(time * 0.75, time * 0.25)) * 0.25;
       float wind3 = noise(pos * 1.2 + vec2(time * 0.5, time * 0.1)) * 0.125;
       
       // Add stronger horizontal movement
       float horizontalDrift = sin(time * 1.5) * 0.3 + cos(time * 2.5) * 0.2;
       return wind1 + wind2 + wind3 + horizontalDrift;
     }
     
     // Create ocean tide effect
     float tideEffect(vec2 pos, float time) {
       float tide1 = sin(pos.x * 0.5 + time * 1.5) * cos(pos.y * 0.3 + time * 1.0) * 0.3;
       float tide2 = sin(pos.x * 0.2 + time * 0.5) * cos(pos.y * 0.1 + time * 0.25) * 0.2;
       return tide1 + tide2;
     }
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      // Create dynamic sand movement
      vec3 pos = position;
      
      // Combine wind and tide effects
      float wind = windEffect(pos.xy, uTime);
      float tide = tideEffect(pos.xy, uTime);
      float combined = wind + tide;
      
      // Add vertical movement for sand particles
      pos.z += combined * 0.2;
      
             // Add stronger horizontal drift for wind effect
       pos.x += wind * 0.3;
       pos.y += tide * 0.05;
      
      // Calculate alpha based on progress and UV
      vAlpha = smoothstep(uProgress - 0.1, uProgress, 1.0 - uv.y);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Fragment shader for dynamic sand movement
  const fragmentShader = `
    uniform float uTime;
    uniform float uProgress;
    
    varying vec2 vUv;
    varying float vAlpha;
    varying vec3 vPosition;
    
    // Improved noise function for sand grains
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
         // Create sand grain pattern with movement
     float sandGrain(vec2 uv, float scale, float time) {
       vec2 grainUV = uv * scale;
       float grain = 0.0;
       
       // Multiple layers of noise with time-based movement
       grain += noise(grainUV + vec2(time * 0.5, time * 0.25)) * 0.5;
       grain += noise(grainUV * 2.0 + vec2(time * 0.75, time * 0.4)) * 0.25;
       grain += noise(grainUV * 4.0 + vec2(time * 1.0, time * 0.6)) * 0.125;
       grain += noise(grainUV * 8.0 + vec2(time * 1.25, time * 0.75)) * 0.0625;
       
       return grain;
     }
     
     // Create individual sand particles with drift
     float sandParticle(vec2 uv, float size, float time, vec2 drift) {
       vec2 particleUV = fract(uv * size + drift * time);
       float dist = length(particleUV - 0.5);
       return smoothstep(0.5, 0.0, dist);
     }
     
          // Create wind ripples with horizontal movement
     float windRipples(vec2 uv, float time) {
       float ripple1 = sin(uv.x * 20.0 + time * 10.0) * cos(uv.y * 15.0 + time * 7.5) * 0.1;
       float ripple2 = sin(uv.x * 30.0 + time * 15.0) * cos(uv.y * 25.0 + time * 12.5) * 0.05;
       
       // Add horizontal drifting ripples
       float horizontalRipple = sin(uv.x * 10.0 + time * 7.5) * 0.15;
       return ripple1 + ripple2 + horizontalRipple;
     }
     
     // Create tide patterns
     float tidePatterns(vec2 uv, float time) {
       float tide1 = sin(uv.x * 5.0 + time * 2.5) * 0.2;
       float tide2 = cos(uv.y * 3.0 + time * 1.5) * 0.15;
       float tide3 = sin(uv.x * 2.0 + uv.y * 2.0 + time * 4.0) * 0.1;
       return tide1 + tide2 + tide3;
     }
    
    void main() {
      // Base sand color with variation
      vec3 sandBase = vec3(0.88, 0.78, 0.55);
      vec3 sandDark = vec3(0.75, 0.65, 0.45);
      vec3 sandLight = vec3(0.95, 0.85, 0.65);
      vec3 sandWet = vec3(0.65, 0.55, 0.35); // Darker for wet sand
      
      // Create dynamic sand grain texture
      float grain = sandGrain(vUv, 50.0, uTime);
      
             // Create sand particles with enhanced wind drift
       float particles = 0.0;
       vec2 windDrift = vec2(0.3, 0.05); // Increased horizontal drift
       vec2 tideDrift = vec2(0.02, 0.08);
      
      particles += sandParticle(vUv + vec2(0.1, 0.2), 30.0, uTime, windDrift);
      particles += sandParticle(vUv + vec2(0.3, 0.7), 25.0, uTime, windDrift);
      particles += sandParticle(vUv + vec2(0.8, 0.1), 35.0, uTime, windDrift);
      particles += sandParticle(vUv + vec2(0.5, 0.9), 20.0, uTime, windDrift);
      
      // Add wind ripples
      float ripples = windRipples(vUv, uTime);
      
      // Add tide patterns
      float tide = tidePatterns(vUv, uTime);
      
      // Mix sand colors based on grain, particles, and environmental effects
      vec3 sandColor = mix(sandBase, sandDark, grain * 0.3);
      sandColor = mix(sandColor, sandLight, particles * 0.2);
      sandColor = mix(sandColor, sandWet, tide * 0.3);
      
                           // Add enhanced dynamic movement effects
        float windMovement = sin(uTime * 4.0 + vPosition.x * 15.0) * 0.2; // Increased amplitude
        float tideMovement = cos(uTime * 3.0 + vPosition.y * 10.0) * 0.08;
        float rippleMovement = ripples * 0.25; // Increased ripple effect
        
        // Add horizontal swaying motion
        float horizontalSway = sin(uTime * 2.0) * 0.15;
      
             sandColor += vec3(windMovement * 0.05, tideMovement * 0.03, rippleMovement * 0.02);
       
       // Add horizontal swaying to color
       sandColor += vec3(horizontalSway * 0.1, 0.0, 0.0);
       
       // Add subtle color variation based on movement
       sandColor += vec3(ripples * 0.1, tide * 0.08, windMovement * 0.05);
      
      gl_FragColor = vec4(sandColor, vAlpha);
    }
  `;

  useFrame(() => {
    if (material.current) {
      material.current.uniforms.uTime.value = clock.getElapsedTime();
      material.current.uniforms.uProgress.value = progress;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, 400, 400]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
      />
    </mesh>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 5, 5]} intensity={0.5} />
      <SandWaves progress={progress} />
    </>
  );
}

export default function TreasureMapCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [progress, setProgress] = useState(0);

  // Update progress based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate progress based on how much of the section is visible
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const viewportHeight = window.innerHeight;

        // Start revealing when section is 20% visible, complete when 80% visible
        const startReveal = viewportHeight * 0.8;
        const endReveal = viewportHeight * 0.2;

        let scrollProgress = 0;
        if (sectionTop <= startReveal) {
          scrollProgress = Math.max(
            0,
            Math.min(1, (startReveal - sectionTop) / (startReveal - endReveal))
          );
        }

        setProgress(scrollProgress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const cards = [
    {
      title: "Vetted Quality",
      description:
        "Every item is quality-checked before delivery & payment. Shop with confidence.",
      icon: (
        <svg
          className="w-32 h-32 text-black"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
        </svg>
      ),
      treasureMapContent: (
        <div className="space-y-3">
          <ul className="text-left space-y-2">
            <li>• Every item is quality-checked before delivery & payment</li>
            <li>• No guessing on condition — what you see is what you get</li>
            <li>• Shop with confidence knowing items meet our standards</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Safe Transactions",
      description:
        "We hold funds securely until delivery is confirmed. No meeting strangers or risky cash deals.",
      icon: (
        <svg
          className="w-32 h-32 text-black"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7L19 9.11V11C19 15.52 16.02 19.69 12 20.93C7.98 19.69 5 15.52 5 11V9.11L12 7Z" />
        </svg>
      ),
      treasureMapContent: (
        <div className="space-y-3">
          <ul className="text-left space-y-2">
            <li>• We hold funds securely until delivery is confirmed</li>
            <li>• No meeting strangers or risky cash deals</li>
            <li>• Clear return policy for damaged or misrepresented items</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Faster, Easier Buying",
      description:
        "Handpicked items released in exclusive batches. First to click 'Buy' gets the item.",
      icon: (
        <svg
          className="w-32 h-32 text-black"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
        </svg>
      ),
      treasureMapContent: (
        <div className="text-left space-y-2">
          <ul className="text-left space-y-2">
            <li>• Handpicked items released in exclusive batches</li>
            <li>
              • Prices drop on a schedule until sold (Dutch auction style)
            </li>
            <li>• First to click "Buy" gets the item — no bidding wars</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <section
      id="why-treasurehub"
      ref={sectionRef}
      className="py-20 px-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #f4d03f 0%, #f39c12 25%, #e67e22 50%, #d35400 75%, #ba4a00 100%)",
        backgroundImage:
          "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
      }}
    >
      {/* Full-viewport Canvas */}
      <div className="absolute inset-0 z-20">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Scene progress={progress} />
        </Canvas>
      </div>

      {/* HTML Content Layer */}
      <div
        className="max-w-6xl mx-auto relative z-30"
        style={{
          pointerEvents: progress > 0.8 ? "auto" : "none",
          opacity: Math.min(1, progress * 1.5),
        }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Why TreasureHub?
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Discover the treasure map to stress-free selling.
          </p>
        </motion.div>
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          style={{ position: "relative", zIndex: 40 }}
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        >
          {cards.map((card, index) => (
            <TreasureCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              treasureMapContent={card.treasureMapContent}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
