// app/components/EmptyState.tsx
import { FolderOpen, LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = FolderOpen, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-50 p-6 rounded-full mb-4">
        <Icon size={48} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-700">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-xs italic">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}