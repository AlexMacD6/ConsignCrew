import React, { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import Crate from './Crate'
import BoxSpawner from './BoxSpawner'
import useCrateFull from '../hooks/useCrateFull'

function Scene({ onCrateFull }) {
  const { camera } = useThree()
  const [isCrateFull, setIsCrateFull] = useState(false)
  const [shouldStopSpawning, setShouldStopSpawning] = useState(false)
  const [shouldFadeBoxes, setShouldFadeBoxes] = useState(false)
  
  // Camera animation spring
  const [cameraSpring, cameraApi] = useSpring(() => ({
    position: [0, 6, 12],
    config: { mass: 1, tension: 170, friction: 26 }
  }))

  // Check if crate is full using our custom hook
  const { maxY, boxCount } = useCrateFull()

  // Handle crate full condition
  useEffect(() => {
    if (maxY > 5 || boxCount >= 15) {
      if (!isCrateFull) {
        setIsCrateFull(true)
        setShouldStopSpawning(true)
        setShouldFadeBoxes(true)
        
        // Animate camera inside crate
        cameraApi.start({
          position: [0, 2, 8],
          config: { duration: 2000 }
        })
        
        // Call parent callback
        setTimeout(() => {
          onCrateFull()
        }, 2500)
      }
    }
  }, [maxY, boxCount, isCrateFull, cameraApi, onCrateFull])

  // Fade box materials over time
  useFrame((state) => {
    if (shouldFadeBoxes) {
      // This will be handled in individual box components
    }
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      {/* Environment */}
      <fog attach="fog" args={['#1a1a1a', 10, 50]} />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Animated Camera */}
      <animated.perspectiveCamera 
        ref={camera}
        {...cameraSpring}
        fov={50}
        aspect={window.innerWidth / window.innerHeight}
        near={0.1}
        far={1000}
      />

      {/* Crate */}
      <Crate />

      {/* Box Spawner */}
      {!shouldStopSpawning && (
        <BoxSpawner shouldFade={shouldFadeBoxes} />
      )}
    </>
  )
}

export default Scene 