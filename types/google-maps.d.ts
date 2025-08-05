// Google Maps API type declarations for Web Components
// This file provides TypeScript support for Google Maps Web Components

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': {
        placeholder?: string;
        class?: string;
        types?: string;
        'component-restrictions'?: string;
        onGmpPlaceselect?: (event: CustomEvent) => void;
        onGmpPlacechange?: (event: CustomEvent) => void;
      };
    }
  }
}

export {}; 