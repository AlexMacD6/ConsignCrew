import React, { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import { animated, useSpring } from '@react-spring/three'

// Individual box component
function Box({ position, size, color, shouldFade }) {
  const [ref, api] = useBox(() => ({
    args: [size, size, size],
    position,
    mass: 1,
    material: { friction: 0.3, restitution: 0.2 }
  }))

  const [fadeSpring, fadeApi] = useSpring(() => ({
    opacity: 1,
    config: { duration: 800 }
  }))

  // Fade out when shouldFade is true
  useEffect(() => {
    if (shouldFade) {
      fadeApi.start({ opacity: 0.2 })
    }
  }, [shouldFade, fadeApi])

  return (
    <animated.mesh 
      ref={ref} 
      castShadow 
      receiveShadow
      material-opacity={fadeSpring.opacity}
    >
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} transparent />
    </animated.mesh>
  )
}

function BoxSpawner({ shouldFade }) {
  const [boxes, setBoxes] = useState([])
  const lastSpawnTime = useRef(0)
  const boxId = useRef(0)

  // Box colors for variety
  const boxColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Gold
    '#BB8FCE', // Purple
    '#85C1E9', // Sky Blue
  ]

  useFrame((state) => {
    const currentTime = state.clock.elapsedTime
    
    // Spawn new box every 0.8-1.4 seconds
    if (currentTime - lastSpawnTime.current > 0.8 + Math.random() * 0.6) {
      const size = 0.8 + Math.random() * 0.6 // Random size between 0.8-1.4 units
      const x = (Math.random() - 0.5) * 6 // Random X position within crate
      const z = (Math.random() - 0.5) * 6 // Random Z position within crate
      const color = boxColors[Math.floor(Math.random() * boxColors.length)]
      
      const newBox = {
        id: boxId.current++,
        position: [x, 10, z],
        size,
        color
      }
      
      setBoxes(prev => [...prev, newBox])
      lastSpawnTime.current = currentTime
    }
  })

  // Clean up boxes that have fallen too far
  useEffect(() => {
    const interval = setInterval(() => {
      setBoxes(prev => prev.filter(box => box.position[1] > -10))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <group>
      {boxes.map((box) => (
        <Box
          key={box.id}
          position={box.position}
          size={box.size}
          color={box.color}
          shouldFade={shouldFade}
        />
      ))}
    </group>
  )
}

export default BoxSpawner 