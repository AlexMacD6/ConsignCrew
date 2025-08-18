"use client";

import Script from "next/script";

export default function MetaPixelScript() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!pixelId) {
    console.warn("Meta Pixel ID not configured. Skipping Meta Pixel script.");
    return null;
  }

  console.log("Meta Pixel: Initializing with ID:", pixelId);

  return (
    <>
      {/* Meta Pixel Base Code */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          // Prevent multiple initializations
          if (window.metaPixelInitialized) {
            console.log('Meta Pixel: Already initialized, skipping...');
            return;
          }
          
          console.log('Meta Pixel: Script loading...');
          
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          console.log('Meta Pixel: Script loaded, initializing...');
          
          // Guard against missing pixel ID
          if ('${pixelId}' && window.fbq) {
            fbq('init', '${pixelId}');
            console.log('Meta Pixel: Initialized with ID: ${pixelId}');
            
            fbq('track', 'PageView');
            console.log('Meta Pixel: PageView tracked');
            
            // Mark as initialized
            window.metaPixelInitialized = true;
          } else {
            console.warn('Meta Pixel: Missing pixel ID or fbq not available');
          }
          
          // Debug: Check if fbq is available
          console.log('Meta Pixel: fbq available:', typeof window.fbq !== 'undefined');
          console.log('Meta Pixel: fbq loaded:', window.fbq && window.fbq.loaded);
        `}
      </Script>

      {/* Meta Pixel Noscript Fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
