export interface TreasureDrop {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  radius: number; // Radius in feet
  status: "active" | "found";
  clue: string;
  image: string | null;
  reward: string;
  foundBy: string | null;
  foundAt: string | null;
  createdAt?: string;
  treasureCode?: {
    id: string;
    code: string;
    isActive: boolean;
    maxUses: number;
    currentUses: number;
  } | null;
} 