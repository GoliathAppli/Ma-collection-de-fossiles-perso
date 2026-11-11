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

// Ammonite SVG Icon - Représentation paléontologique avec spires, côtes et relief
export function AmmoniteIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} select-none overflow-visible`} fill="currentColor">
      {/* Tour externe (Whorl principal) */}
      <path
        d="M 86 38
           C 89 50, 86 68, 71 82
           C 56 96, 32 96, 18 81
           C 4 66, 4 42, 19 24
           C 34 6, 61 6, 80 24
           C 85 29, 88 33, 89 39
           L 78 46
           C 74 39, 69 34, 61 28
           C 49 18, 31 20, 22 32
           C 14 44, 15 60, 26 71
           C 37 81, 54 81, 65 71
           C 74 61, 75 51, 74 45
           Z"
        fillOpacity="0.88"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Deuxième tour de spire */}
      <path
        d="M 74 45
           C 74 52, 70 62, 62 69
           C 52 77, 36 77, 27 68
           C 17 58, 17 43, 25 33
           C 33 23, 48 23, 58 32
           C 63 37, 66 41, 67 46
           L 59 49
           C 57 45, 54 41, 49 38
           C 42 33, 33 34, 29 40
           C 24 46, 24 54, 30 60
           C 36 65, 45 65, 51 60
           C 56 55, 57 50, 58 47
           Z"
        fillOpacity="0.75"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Troisième tour et ombilic central */}
      <path
        d="M 58 47
           C 57 52, 54 58, 49 61
           C 43 65, 34 64, 30 59
           C 25 53, 26 45, 31 40
           C 36 35, 44 36, 49 40
           C 52 43, 53 45, 54 48
           Z"
        fillOpacity="0.6"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      {/* Ombilic central */}
      <circle cx="41" cy="48" r="6" fillOpacity="0.95" />
      <circle cx="41" cy="48" r="3" fill="none" stroke="currentColor" strokeWidth="1" />

      {/* Côtes transversales sculptées (rayons / cloisons) */}
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        <line x1="86" y1="38" x2="77" y2="44" />
        <line x1="88" y1="46" x2="76" y2="48" />
        <line x1="87" y1="54" x2="74" y2="54" />
        <line x1="84" y1="62" x2="72" y2="59" />
        <line x1="79" y1="70" x2="68" y2="65" />
        <line x1="73" y1="77" x2="63" y2="70" />
        <line x1="65" y1="84" x2="57" y2="75" />
        <line x1="56" y1="89" x2="50" y2="78" />
        <line x1="47" y1="91" x2="43" y2="79" />
        <line x1="38" y1="90" x2="35" y2="78" />
        <line x1="29" y1="86" x2="28" y2="75" />
        <line x1="21" y1="80" x2="23" y2="70" />
        <line x1="14" y1="72" x2="19" y2="63" />
        <line x1="9" y1="63" x2="17" y2="55" />
        <line x1="7" y1="53" x2="16" y2="47" />
        <line x1="8" y1="43" x2="18" y2="40" />
        <line x1="11" y1="34" x2="21" y2="34" />
        <line x1="17" y1="26" x2="27" y2="29" />
        <line x1="25" y1="19" x2="35" y2="26" />
        <line x1="35" y1="14" x2="42" y2="24" />
        <line x1="45" y1="11" x2="50" y2="23" />
        <line x1="55" y1="11" x2="57" y2="24" />
        <line x1="65" y1="13" x2="64" y2="27" />
        <line x1="74" y1="18" x2="70" y2="32" />
        <line x1="81" y1="26" x2="75" y2="38" />
      </g>
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
