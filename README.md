# ConsignCrew - Packing Tetris Landing Page

A stunning 3D interactive landing page featuring boxes "Tetris-dropping" into a shipping crate. When the crate fills up, the camera dives inside to reveal an email signup modal.

## 🚀 Features

- **3D Physics Simulation**: Realistic box dropping with physics using @react-three/cannon
- **Interactive Experience**: Watch colorful boxes fall and stack naturally
- **Camera Animation**: Smooth camera transition when crate fills
- **Email Signup**: Beautiful modal for collecting early access emails
- **Accessibility**: Skip animation option and reduced motion support
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Efficient rendering with shared geometries

## 🛠️ Tech Stack

- **React 18** with **Next.js** for fast development
- **@react-three/fiber** for Three.js integration
- **@react-three/cannon** for physics simulation
- **@react-three/drei** for helpful utilities
- **@react-spring/three** for smooth animations
- **Tailwind CSS** for styling

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd consigncrew-packing-tetris
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 How It Works

1. **Box Spawning**: Colorful boxes spawn every 0.8-1.4 seconds with random sizes and positions
2. **Physics Simulation**: Boxes fall naturally with gravity and collision detection
3. **Crate Monitoring**: The system tracks the highest box position and total box count
4. **Trigger Conditions**: Animation triggers when either:
   - Maximum Y position > 5 units, OR
   - 15+ boxes have been spawned
5. **Camera Animation**: Camera smoothly moves inside the crate
6. **Box Fading**: Boxes fade to 20% opacity over 0.8 seconds
7. **Signup Modal**: Email collection modal appears with backdrop blur

## 🔧 Configuration

### Physics Settings
- **Gravity**: `[0, -9.81, 0]` (realistic Earth gravity)
- **Box Friction**: 0.3 (realistic friction)
- **Box Restitution**: 0.2 (slight bounce)

### Animation Settings
- **Spawn Interval**: 0.8-1.4 seconds (randomized)
- **Box Sizes**: 0.8-1.4 units (randomized)
- **Camera Transition**: 2 seconds duration
- **Box Fade**: 0.8 seconds duration

## 📧 Email Integration

The app currently uses a mock API endpoint. To integrate with a real email service:

1. **Replace the API call** in `SignupModal.jsx`:
   ```javascript
   // Replace this mock call:
   const response = await fetch('/api/subscribe', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email }),
   })
   ```

2. **Popular Email Services**:
   - **Mailchimp**: Use their API with your list ID
   - **Airtable**: Create a base with email column
   - **ConvertKit**: Use their subscriber API
   - **SendGrid**: Use their contacts API

### Example Mailchimp Integration:
```javascript
const response = await fetch(`https://us1.api.mailchimp.com/3.0/lists/${LIST_ID}/members`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email_address: email,
    status: 'subscribed',
  }),
})
```

## 🎨 Customization

### Colors
Update `tailwind.config.js` to customize the color scheme:
```javascript
colors: {
  'consigncrew-gold': '#D4AF3D',
  'consigncrew-dark': '#1a1a1a',
}
```

### Box Colors
Modify the `boxColors` array in `BoxSpawner.jsx`:
```javascript
const boxColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1',
  // Add your custom colors here
]
```

### Crate Dimensions
Adjust crate size in `Crate.jsx`:
```javascript
// Current: 8x6x8 units
args: [8, 6, 0.1] // width, height, depth
```

## ♿ Accessibility

- **Skip Animation**: "Skip Animation" button in top-right corner
- **Reduced Motion**: Automatically detects `prefers-reduced-motion` and shows static version
- **Keyboard Navigation**: Arrow keys work for navigation
- **Screen Reader**: Proper ARIA labels and semantic HTML

## 📱 Mobile Support

- **Touch Controls**: Works with touch gestures
- **Responsive Design**: Adapts to different screen sizes
- **Performance**: Optimized for mobile devices

## 🔍 Performance Tips

- **Shared Geometries**: Boxes reuse the same geometry and material
- **Pixel Ratio**: Limited to 2x for performance
- **Box Cleanup**: Automatically removes boxes that fall too far
- **Efficient Rendering**: Only renders visible elements

## 🐛 Troubleshooting

### Common Issues

1. **Physics not working**: Ensure @react-three/cannon is properly installed
2. **Performance issues**: Check if too many boxes are being spawned
3. **Camera not moving**: Verify @react-spring/three is installed
4. **Modal not appearing**: Check if the crate full condition is being met

### Debug Mode
Add this to see physics debug info:
```javascript
// In App.jsx, add debug prop to Physics
<Physics gravity={[0, -9.81, 0]} debug>
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for ConsignCrew**