import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import Scene from './components/Scene'
import SignupModal from './components/SignupModal'
import useCrateFull from './hooks/useCrateFull'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasSignedUp, setHasSignedUp] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for existing signup and reduced motion preference
  useEffect(() => {
    const signedUp = localStorage.getItem('signedUp')
    if (signedUp) {
      setHasSignedUp(true)
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Handle crate full condition
  const handleCrateFull = () => {
    setIsModalOpen(true)
  }

  // Handle signup success
  const handleSignupSuccess = () => {
    localStorage.setItem('signedUp', 'true')
    setHasSignedUp(true)
    setIsModalOpen(false)
  }

  // Skip animation immediately
  const skipAnimation = () => {
    handleCrateFull()
  }

  // If user has already signed up, show a simple message
  if (hasSignedUp) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-consigncrew-dark to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Welcome back to TreasureHub!</h1>
          <p className="text-xl text-gray-300">You're already signed up for early access.</p>
          <button
            onClick={() => {
              localStorage.removeItem('signedUp')
              setHasSignedUp(false)
            }}
            className="mt-6 px-6 py-3 bg-consigncrew-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Watch Animation Again
          </button>
        </div>
      </div>
    )
  }

  // If user prefers reduced motion, show static version
  if (prefersReducedMotion) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-consigncrew-dark to-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-2xl mx-auto p-8">
                  <h1 className="text-5xl font-bold mb-6 text-consigncrew-gold">
          TreasureHub
        </h1>
          <h2 className="text-3xl font-semibold mb-4">
            The Future of Consignment
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Experience our revolutionary 3D packing technology that optimizes space 
            and maximizes value for your consigned items.
          </p>
          <SignupModal 
            open={true} 
            onClose={() => {}} 
            onSuccess={handleSignupSuccess}
            static={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative">
      {/* Skip Animation Link */}
      <button
        onClick={skipAnimation}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors text-sm"
      >
        Skip Animation
      </button>

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 6, 12], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
          setPixelRatio: Math.min(2, window.devicePixelRatio)
        }}
      >
        <Physics gravity={[0, -9.81, 0]}>
          <Scene onCrateFull={handleCrateFull} />
        </Physics>
      </Canvas>

      {/* Signup Modal */}
      <SignupModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSignupSuccess}
      />
    </div>
  )
}

export default App 