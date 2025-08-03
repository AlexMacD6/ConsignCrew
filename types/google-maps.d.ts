declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    setCenter(latlng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    fitBounds(bounds: LatLngBounds): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(point: LatLng): LatLngBounds;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
    animation?: Animation;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface Icon {
    url: string;
    scaledSize?: Size;
    anchor?: Point;
  }

  interface Symbol {
    path: string;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    scale?: number;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: MapTypeStyler[];
  }

  interface MapTypeStyler {
    visibility?: string;
    color?: string;
    weight?: number;
    gamma?: number;
    hue?: string;
    lightness?: number;
    saturation?: number;
  }

  interface MapsEventListener {
    remove(): void;
  }

  enum Animation {
    BOUNCE = 1,
    DROP = 2
  }
}

export {}; 