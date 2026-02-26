"use client";

import { ChevronDown } from "lucide-react";

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
    <div className="flex justify-end p-4">
      <button 
        onClick={handleScroll} 
          className="
            flex flex-col items-center justify-center
            hover:bg-[#A2A6FD] border-2 border-[#2C2C2C] text-[#2C2C2C]
            font-semibold py-3 px-6 
            rounded-full /* Forma redondeada */
            transition-all duration-300 ease-in-out /* Transiciones suaves para hover */
            hover:scale-105 /* Crece un poco al pasar el mouse */
           
            focus:outline-none focus:ring-0 /* Elimina el resplandor azul al enfocar */
          "
        aria-label={label}
      >
        <span className="mb-1">{label}</span>
      </button>
    </div>
  );
}