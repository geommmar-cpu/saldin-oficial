import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { goalPresets } from "@/lib/goalPresets";
import { cn } from "@/lib/utils";

interface GoalImagePickerProps {
  selected: string | null;
  onSelect: (presetId: string | null) => void;
}

export const GoalImagePicker = ({ selected, onSelect }: GoalImagePickerProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Imagem (opcional)</label>
      <p className="text-xs text-muted-foreground">Escolha uma imagem para sua caixinha</p>
      <div className="grid grid-cols-3 gap-2">
        {/* No image option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
            selected === null
              ? "border-foreground bg-muted scale-[1.02]"
              : "border-border hover:border-muted-foreground"
          )}
        >
          <ImageOff className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Nenhuma</span>
        </button>

        {goalPresets.map((preset) => (
          <motion.button
            key={preset.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(preset.id)}
            className={cn(
              "aspect-square rounded-xl border-2 overflow-hidden relative transition-all",
              selected === preset.id
                ? "border-foreground scale-[1.02] ring-1 ring-foreground"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <img
              src={preset.image}
              alt={preset.label}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <span className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm text-[10px] font-medium py-1 text-center">
              {preset.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
