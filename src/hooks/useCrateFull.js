import { useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWorld } from '@react-three/cannon'

function useCrateFull() {
  const [maxY, setMaxY] = useState(0)
  const [boxCount, setBoxCount] = useState(0)
  const world = useWorld()

  useFrame(() => {
    if (!world) return

    // Get all bodies in the physics world
    const bodies = world.bodies
    let highestY = 0
    let count = 0

    // Check each body's position
    bodies.forEach((body) => {
      if (body && body.position) {
        const [x, y, z] = body.position
        
        // Only count boxes within the crate bounds
        if (Math.abs(x) < 4 && Math.abs(z) < 4 && y > 0) {
          highestY = Math.max(highestY, y)
          count++
        }
      }
    })

    setMaxY(highestY)
    setBoxCount(count)
  })

  return { maxY, boxCount }
}

export default useCrateFull 