import React from 'react';

// Microbe/Stromatolite SVG Icon for Precambrian
export function MicrobeIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} fill-none stroke-current stroke-2`}>
      {/* Outer cell membrane */}
      <path d="M50 15 Q75 10 85 30 Q95 50 82 72 Q65 92 40 85 Q15 75 15 50 Q15 25 50 15" strokeWidth="3" />
      {/* Nucleus / Inner structure */}
      <circle cx="45" cy="50" r="8" strokeWidth="2" />
      <circle cx="65" cy="40" r="4" strokeWidth="2" />
      <circle cx="35" cy="35" r="3" strokeWidth="2" />
      {/* Flagella / Cilia */}
      <path d="M15 50 Q5 55 8 65" />
      <path d="M22 23 Q12 15 15 5" />
      <path d="M85 30 Q95 20 90 10" />
      <path d="M82 72 Q95 85 85 95" />
      <path d="M40 85 Q35 95 25 90" />
    </svg>
  );
}

// Trilobite SVG Icon
export function TrilobiteIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} fill-none stroke-current stroke-2`}>
      {/* Central body ax */}
      <line x1="50" y1="15" x2="50" y2="85" />
      {/* Head */}
      <path d="M25,35 Q50,15 75,35" strokeWidth="3" />
      <circle cx="38" cy="28" r="3" className="fill-current" />
      <circle cx="62" cy="28" r="3" className="fill-current" />
      {/* Segments (left & right) */}
      <path d="M50,42 Q20,38 18,48 Q20,50 50,45" />
      <path d="M50,42 Q80,38 82,48 Q80,50 50,45" />
      
      <path d="M50,50 Q18,48 16,56 Q18,58 50,53" />
      <path d="M50,50 Q82,48 84,56 Q82,58 50,53" />

      <path d="M50,58 Q16,56 15,64 Q16,66 50,61" />
      <path d="M50,58 Q84,56 85,64 Q84,66 50,61" />

      <path d="M50,66 Q18,65 17,72 L50,69" />
      <path d="M50,66 Q82,65 83,72 L50,69" />

      {/* Pygidium / Tail */}
      <path d="M35,72 Q50,88 65,72 Q50,82 35,72" />
      {/* Antennas */}
      <path d="M43,20 Q30,5 20,8" />
      <path d="M57,20 Q70,5 80,8" />
    </svg>
  );
}

// Ammonite SVG Icon
export function AmmoniteIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} fill-none stroke-current stroke-2`}>
      {/* Golden Spiral */}
      <path d="M50,50 
               Q55,45 52,38 
               Q45,32 36,36 
               Q26,42 28,54 
               Q32,68 48,68 
               Q66,66 68,44 
               Q70,18 42,16 
               Q10,14 6,50 
               Q2,90 50,92 
               Q98,94 94,36" 
            strokeWidth="3.5" 
      />
      {/* Rib lines radiating outwards from core to simulate shell partitions */}
      <line x1="50" y1="50" x2="51" y2="44" strokeWidth="1" />
      <line x1="50" y1="50" x2="44" y2="48" strokeWidth="1" />
      <line x1="44" y1="48" x2="38" y2="42" strokeWidth="1.2" />
      <line x1="36" y1="36" x2="30" y2="30" strokeWidth="1.2" />
      <line x1="28" y1="54" x2="18" y2="58" strokeWidth="1.5" />
      <line x1="48" y1="68" x2="48" y2="82" strokeWidth="1.5" />
      <line x1="68" y1="44" x2="84" y2="42" strokeWidth="1.8" />
      <line x1="42" y1="16" x2="40" y2="2" strokeWidth="2" />
      <line x1="6" y1="50" x2="0" y2="50" strokeWidth="2.2" />
      <line x1="50" y1="92" x2="50" y2="99" strokeWidth="2.5" />
      <line x1="94" y1="36" x2="99" y2="34" strokeWidth="2.5" />
    </svg>
  );
}

// Mammoth/Elephant SVG Icon
export function MammothIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} fill-none stroke-current stroke-2`}>
      {/* Elephant head back dome */}
      <path d="M35,35 Q20,30 18,48 Q20,62 38,62" />
      {/* Huge hairy back dome */}
      <path d="M38,30 Q50,15 75,25 Q90,32 88,54 L84,75 L74,75 L70,54 Q65,48 50,56 L55,75 L45,75 Q40,65 38,62" />
      {/* Large Curved Tusks */}
      <path d="M22,50 Q5,48 2,36 Q0,26 12,28 Q18,31 22,42" strokeWidth="3" />
      <path d="M32,54 Q15,56 10,48 Q8,35 20,38 Q25,41 28,48" strokeWidth="3" />
      {/* Hairy crown */}
      <path d="M38,30 Q45,22 55,24" strokeWidth="1.5" />
      {/* Eye */}
      <circle cx="28" cy="42" r="1.5" className="fill-current" />
      {/* Trunk curled */}
      <path d="M22,46 Q12,50 14,58 Q16,64 26,62 Q34,60 30,52" strokeWidth="2.5" />
      {/* Small cute tail */}
      <path d="M88,50 L92,62" />
    </svg>
  );
}
