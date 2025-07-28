import React from 'react'
import { usePlane, useBox } from '@react-three/cannon'

function Crate() {
  // Floor
  const [floorRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
    material: { friction: 0.3, restitution: 0.2 }
  }))

  // Back wall
  const [backWallRef] = useBox(() => ({
    args: [8, 6, 0.1],
    position: [0, 3, -4],
    type: 'Static',
    material: { friction: 0.3, restitution: 0.2 }
  }))

  // Front wall
  const [frontWallRef] = useBox(() => ({
    args: [8, 6, 0.1],
    position: [0, 3, 4],
    type: 'Static',
    material: { friction: 0.3, restitution: 0.2 }
  }))

  // Left wall
  const [leftWallRef] = useBox(() => ({
    args: [0.1, 6, 8],
    position: [-4, 3, 0],
    type: 'Static',
    material: { friction: 0.3, restitution: 0.2 }
  }))

  // Right wall
  const [rightWallRef] = useBox(() => ({
    args: [0.1, 6, 8],
    position: [4, 3, 0],
    type: 'Static',
    material: { friction: 0.3, restitution: 0.2 }
  }))

  return (
    <group>
      {/* Floor */}
      <mesh ref={floorRef} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Back wall */}
      <mesh ref={backWallRef} castShadow receiveShadow>
        <boxGeometry args={[8, 6, 0.1]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* Front wall */}
      <mesh ref={frontWallRef} castShadow receiveShadow>
        <boxGeometry args={[8, 6, 0.1]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* Left wall */}
      <mesh ref={leftWallRef} castShadow receiveShadow>
        <boxGeometry args={[0.1, 6, 8]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* Right wall */}
      <mesh ref={rightWallRef} castShadow receiveShadow>
        <boxGeometry args={[0.1, 6, 8]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* Crate edges for visual appeal */}
      <group>
        {/* Top edges */}
        <mesh position={[0, 6, 0]} castShadow>
          <boxGeometry args={[8.2, 0.1, 0.1]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[0, 6, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, 8.2]} />
          <meshStandardMaterial color="#654321" />
        </mesh>

        {/* Corner posts */}
        <mesh position={[-4, 3, -4]} castShadow>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[4, 3, -4]} castShadow>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[-4, 3, 4]} castShadow>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[4, 3, 4]} castShadow>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </group>
    </group>
  )
}

export default Crate 