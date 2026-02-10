import travelImg from "@/assets/goal-presets/travel.jpg";
import houseImg from "@/assets/goal-presets/house.jpg";
import carImg from "@/assets/goal-presets/car.jpg";
import emergencyImg from "@/assets/goal-presets/emergency.jpg";
import educationImg from "@/assets/goal-presets/education.jpg";
import leisureImg from "@/assets/goal-presets/leisure.jpg";

export interface GoalPreset {
  id: string;
  label: string;
  image: string;
}

export const goalPresets: GoalPreset[] = [
  { id: "travel", label: "Viagem", image: travelImg },
  { id: "house", label: "Casa", image: houseImg },
  { id: "car", label: "Carro", image: carImg },
  { id: "emergency", label: "Emergência", image: emergencyImg },
  { id: "education", label: "Estudos", image: educationImg },
  { id: "leisure", label: "Lazer", image: leisureImg },
];

export const getPresetImage = (presetId: string | null | undefined): string | null => {
  if (!presetId) return null;
  const preset = goalPresets.find((p) => p.id === presetId);
  return preset?.image ?? null;
};
