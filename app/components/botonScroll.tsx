"use client";

import { Button } from "./Button";

export default function BotonScroll({ targetId, label }: { targetId: string, label: string }) {
  const handleScroll = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <div className="flex justify-end">
      <Button
        onClick={handleScroll}
        variant="general"
        aria-label={label}
      >
        <span>{label}</span>
      </Button>
    </div>
  );
}