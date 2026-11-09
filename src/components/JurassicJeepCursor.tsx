import React from 'react';
import { motion } from 'motion/react';

interface JurassicJeepCursorProps {
  progress: number;
}

/**
 * Jeep Wrangler Tour Vehicle #05 (Jurassic Park)
 * Réplique exacte du modèle 4 portes de la photo :
 * - Carrosserie dégradée : Jaune soleil vif sur le bas et les ailes, vert tropical au milieu, toit rouge vif
 * - Rayures tigrées "griffes de dinosaure" rouges officielles descendant du toit
 * - Inscription latérale mythique "JURASSIC PARK" avec logo T-Rex circulaire
 * - Numéro officiel "05" rouge sur l'aile arrière
 * - Ailes évasées peintes en jaune assorti
 * - Marchepied tubulaire noir, poignées et charnières noires, vitres arrière surteintées
 * - Jantes bicolores Noir & Jaune à 5 doubles branches qui tournent à 360° avec la progression
 * - Suspension dynamique tout-terrain
 */
export default function JurassicJeepCursor({ progress }: JurassicJeepCursorProps) {
  return (
    <div
      style={{
        left: `${progress}%`,
        transform: 'translateX(-50%)',
      }}
      className="absolute -top-14 sm:-top-16 z-30 pointer-events-none transition-all duration-150 ease-out"
    >
      {/* Vibration et rebond réaliste des suspensions tout-terrain */}
      <motion.div
        animate={{
          y: [0, -1.2, 0.4, -0.7, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.42,
          ease: 'easeInOut',
        }}
        className="relative w-32 h-16 sm:w-36 sm:h-18 flex items-end justify-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
      >
        {/* Faisceau lumineux des phares avant projeté vers la droite */}
        <div
          className="absolute right-0 bottom-5 w-16 h-8 bg-gradient-to-r from-yellow-300/40 via-yellow-400/20 to-transparent blur-md pointer-events-none transform translate-x-10 -rotate-2"
        />

        {/* ================= SVG DU VÉHICULE 4 PORTES TOUR VEHICLE #05 ================= */}
        <svg
          viewBox="0 0 160 76"
          className="w-full h-full overflow-visible select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dégradé de la carrosserie : Jaune vif en bas -> Vert vif au milieu */}
            <linearGradient id="jpBodyGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="68%" stopColor="#22c55e" />
              <stop offset="90%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            {/* Rouge vif pour le toit et les rayures tigrées */}
            <linearGradient id="jpRedRoofGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="40%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            {/* Vitrage teinté fumé profond */}
            <linearGradient id="jpTintedGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0.98" />
            </linearGradient>

            {/* Reflet sur les vitres */}
            <linearGradient id="jpGlassReflect" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            {/* Dégradé texte Jurassic Park */}
            <linearGradient id="jpTextGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Roue de secours arrière fixée sur le hayon (avec housse noire) */}
          <rect x="2" y="24" width="8" height="30" rx="4" fill="#18181b" stroke="#09090b" strokeWidth="1" />
          <path d="M4 27 L4 51" stroke="#27272a" strokeWidth="1.5" strokeLinecap="round" />

          {/* ================= TOIT ET ARCEAU (ROUGE AVEC RAYURES VERTES) ================= */}
          {/* Forme du toit rigide (Hardtop) */}
          <path
            d="M8 12
               L108 11
               L116 26
               L8 26
               Z"
            fill="url(#jpRedRoofGrad)"
            stroke="#991b1b"
            strokeWidth="0.8"
          />

          {/* Rayures tigrées vertes qui montent sur le toit rouge (comme sur la photo) */}
          <path d="M18 11 L22 11 L20 22 L17 22 Z" fill="#22c55e" />
          <path d="M38 11 L43 11 L40 22 L36 22 Z" fill="#22c55e" />
          <path d="M60 11 L65 11 L62 22 L58 22 Z" fill="#22c55e" />
          <path d="M82 11 L87 11 L84 22 L80 22 Z" fill="#22c55e" />
          <path d="M98 11 L103 11 L102 22 L97 22 Z" fill="#22c55e" />

          {/* ================= FENÊTRES SURTEINTÉES (4 PORTES + HAYON) ================= */}
          {/* Vitre latérale arrière de custode */}
          <path
            d="M12 16 L48 16 L48 31 L12 31 Z"
            fill="url(#jpTintedGlass)"
            stroke="#09090b"
            strokeWidth="0.8"
          />
          <path d="M14 18 L30 18 L18 29 L14 29 Z" fill="url(#jpGlassReflect)" />

          {/* Vitre porte arrière */}
          <path
            d="M52 16 L76 16 L76 31 L52 31 Z"
            fill="url(#jpTintedGlass)"
            stroke="#09090b"
            strokeWidth="0.8"
          />
          <path d="M54 18 L68 18 L58 29 L54 29 Z" fill="url(#jpGlassReflect)" />

          {/* Vitre porte avant */}
          <path
            d="M80 16 L104 16 L108 31 L80 31 Z"
            fill="url(#jpTintedGlass)"
            stroke="#09090b"
            strokeWidth="0.8"
          />
          <path d="M82 18 L96 18 L88 29 L82 29 Z" fill="url(#jpGlassReflect)" />

          {/* Montant de pare-brise avant incliné */}
          <path
            d="M108 14 L120 31 L115 32 L106 16 Z"
            fill="#dc2626"
            stroke="#09090b"
            strokeWidth="0.8"
          />

          {/* Rétroviseur extérieur noir */}
          <rect x="110" y="29" width="4.5" height="4" rx="1" fill="#18181b" stroke="#09090b" strokeWidth="0.6" />

          {/* ================= CARROSSERIE PRINCIPALE (DÉGRADÉ VERT/JAUNE) ================= */}
          <path
            d="M9 31
               L116 31
               L124 33
               L145 33
               L147 38
               L148 44
               L148 51
               L138 51
               A 16 16 0 0 0 106 51
               L58 51
               A 16 16 0 0 0 26 51
               L9 51
               Z"
            fill="url(#jpBodyGrad)"
            stroke="#ca8a04"
            strokeWidth="0.8"
          />

          {/* ================= GRIFFES / RAYURES TIGRÉES ROUGES SUR LA CARROSSERIE ================= */}
          {/* Rayure rouge arrière */}
          <path
            d="M9 31 L20 31 C22 36 21 42 16 46 L12 46 C11 41 10 36 9 31 Z"
            fill="url(#jpRedRoofGrad)"
          />
          {/* Rayures rouges entre les vitres et descendant sur le vert */}
          <path
            d="M47 31 L53 31 L50 43 L45 43 Z"
            fill="url(#jpRedRoofGrad)"
          />
          <path
            d="M75 31 L81 31 L78 44 L73 44 Z"
            fill="url(#jpRedRoofGrad)"
          />
          {/* Rayure rouge sur le capot avant */}
          <path
            d="M116 31 L124 33 L129 33 L120 37 L117 37 Z"
            fill="url(#jpRedRoofGrad)"
          />
          <path
            d="M132 33 L142 33 L137 38 L130 38 Z"
            fill="url(#jpRedRoofGrad)"
          />

          {/* ================= AILES ÉVASÉES PEINTES EN JAUNE ASSORTI ================= */}
          {/* Aile arrière évasée jaune (comme sur la photo) */}
          <path
            d="M23 51 A 18 18 0 0 1 59 51 L55 51 A 14.5 14.5 0 0 0 27 51 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.8"
          />
          {/* Aile avant évasée jaune (comme sur la photo) */}
          <path
            d="M103 51 A 18 18 0 0 1 139 51 L135 51 A 14.5 14.5 0 0 0 107 51 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.8"
          />

          {/* ================= MARCHEPIED TUBULURE NOIR SOUS LA CAISSE ================= */}
          <rect x="58" y="52" width="48" height="2.8" rx="1.2" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />

          {/* ================= GRAPHISMES OFFICIELS "JURASSIC PARK" ================= */}
          {/* Logo circulaire T-Rex sur la porte avant */}
          <g transform="translate(68, 38)">
            <circle cx="5" cy="5" r="4.8" fill="#dc2626" stroke="#facc15" strokeWidth="0.8" />
            <circle cx="5" cy="5" r="3.8" fill="#09090b" />
            {/* T-Rex silhouette */}
            <path
              d="M3 6.8 C3 4.5 4.5 3.3 6.4 3.3 C7.2 3.3 7.8 3.8 7.8 4.4 C7.8 4.9 7.3 5.1 6.7 5.1 C6 5.1 5.7 5.5 5.7 6 C5.7 6.6 6.6 6.6 7 6.6"
              stroke="#facc15"
              strokeWidth="0.65"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Inscription "JURASSIC PARK" stylisée le long des portes */}
          <g transform="translate(80, 45)">
            {/* Ombre portée */}
            <text
              x="0.6"
              y="0.6"
              fill="#09090b"
              fontSize="6.8"
              fontFamily="Georgia, serif"
              fontWeight="900"
              letterSpacing="0.2px"
            >
              JURASSIC PARK
            </text>
            {/* Texte avec contour et dégradé jaune/or */}
            <text
              x="0"
              y="0"
              fill="url(#jpTextGrad)"
              stroke="#09090b"
              strokeWidth="0.4"
              fontSize="6.8"
              fontFamily="Georgia, serif"
              fontWeight="900"
              letterSpacing="0.2px"
            >
              JURASSIC PARK
            </text>
          </g>

          {/* ================= NUMÉRO OFFICIEL "05" EN ROUGE ================= */}
          {/* Numéro 05 sur l'aile arrière (exactement comme sur la photo) */}
          <g transform="translate(14, 46.5)">
            <text
              x="0.3"
              y="0.3"
              fill="#09090b"
              fontSize="7.5"
              fontFamily="Impact, Arial Black, sans-serif"
              fontWeight="900"
            >
              05
            </text>
            <text
              x="0"
              y="0"
              fill="#dc2626"
              fontSize="7.5"
              fontFamily="Impact, Arial Black, sans-serif"
              fontWeight="900"
              stroke="#fef2f2"
              strokeWidth="0.2"
            >
              05
            </text>
          </g>

          {/* Trappe à carburant ronde noire sur le flanc arrière gauche */}
          <circle cx="20" cy="38" r="2.8" fill="#18181b" stroke="#3f3f46" strokeWidth="0.6" />

          {/* Poignées de portes noires (2 portes) */}
          <rect x="54" y="36" width="3.6" height="1.4" rx="0.6" fill="#18181b" />
          <rect x="82" y="36" width="3.6" height="1.4" rx="0.6" fill="#18181b" />

          {/* Charnières de portes noires extérieures caractéristiques Jeep */}
          <circle cx="51.5" cy="33.5" r="0.8" fill="#18181b" />
          <circle cx="51.5" cy="46" r="0.8" fill="#18181b" />
          <circle cx="79.5" cy="33.5" r="0.8" fill="#18181b" />
          <circle cx="79.5" cy="46" r="0.8" fill="#18181b" />

          {/* Feu arrière rouge Jeep moderne */}
          <rect x="8" y="37" width="2" height="5" rx="0.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.4" />

          {/* Pare-chocs arrière noir */}
          <rect x="6" y="49" width="4.5" height="3" rx="0.8" fill="#18181b" />

          {/* Phare avant Jeep moderne */}
          <circle cx="147.5" cy="40.5" r="3.2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="147.5" cy="40.5" r="1.5" fill="#ffffff" />

          {/* Pare-chocs avant tout-terrain noir */}
          <rect x="146" y="47" width="8" height="5" rx="1.2" fill="#18181b" stroke="#3f3f46" strokeWidth="0.6" />
        </svg>

        {/* ================= ROUE ARRIÈRE (BICOLORE NOIR & JAUNE TOURNANTE À 360°) ================= */}
        <div
          className="absolute left-[26.25%] bottom-[5px] sm:bottom-[6px] w-[26px] h-[26px] sm:w-[29px] sm:h-[29px]"
          style={{ transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 0.52,
              ease: 'linear',
            }}
            className="w-full h-full rounded-full flex items-center justify-center shadow-lg"
          >
            <BicolorTourWheelSVG />
          </motion.div>
        </div>

        {/* ================= ROUE AVANT (BICOLORE NOIR & JAUNE TOURNANTE À 360°) ================= */}
        <div
          className="absolute left-[76.25%] bottom-[5px] sm:bottom-[6px] w-[26px] h-[26px] sm:w-[29px] sm:h-[29px]"
          style={{ transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 0.52,
              ease: 'linear',
            }}
            className="w-full h-full rounded-full flex items-center justify-center shadow-lg"
          >
            <BicolorTourWheelSVG />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Jante spéciale personnalisée bicolore NOIR & JAUNE (comme sur la photo de l'utilisateur) :
 * - Pneu tout-terrain noir profond avec sculptures
 * - Jante moderne sport à 5 doubles branches (split 5-spoke)
 * - Face des branches en JAUNE VIF assorti à la carrosserie
 * - Intérieur des alésages et moyeu central NOIR PROFOND
 * - Écrous et étrier de frein apparents
 */
function BicolorTourWheelSVG() {
  return (
    <svg viewBox="0 0 34 34" className="w-full h-full select-none" fill="none">
      {/* Pneu extérieur en caoutchouc noir profond */}
      <circle cx="17" cy="17" r="16.5" fill="#18181b" stroke="#09090b" strokeWidth="1" />
      
      {/* Rainures / sculptures des pneus tout-terrain */}
      {[0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336].map((angle) => (
        <line
          key={angle}
          x1="17"
          y1="1.2"
          x2="17"
          y2="3.4"
          stroke="#27272a"
          strokeWidth="1.2"
          strokeLinecap="round"
          transform={`rotate(${angle} 17 17)`}
        />
      ))}

      {/* Cercle intérieur de la jante (fond noir mat) */}
      <circle cx="17" cy="17" r="13" fill="#09090b" stroke="#18181b" strokeWidth="0.8" />

      {/* Disque de frein gris / argenté en arrière-plan */}
      <circle cx="17" cy="17" r="8.5" fill="#3f3f46" stroke="#27272a" strokeWidth="0.5" />
      {/* Étrier de frein argenté visible */}
      <rect x="22" y="14" width="2.5" height="6" rx="0.8" fill="#e4e4e7" />

      {/* ================= LES 5 DOUBLES BRANCHES JAUNES VIVES ================= */}
      {/* Chaque branche a 2 rayons peints en jaune vif (comme sur la photo Nexen) */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 17 17)`}>
          {/* Rayon gauche de la double branche */}
          <path
            d="M15.5 17 L14.2 6.5 L15.6 6.2 L16.4 17 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.25"
          />
          {/* Rayon droit de la double branche */}
          <path
            d="M17.6 17 L18.4 6.2 L19.8 6.5 L18.5 17 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.25"
          />
          {/* Pointe/rebord extérieur jaune sur la jante */}
          <path
            d="M13.8 6.5 A 11.5 11.5 0 0 1 20.2 6.5 L19.4 7.6 A 10 10 0 0 0 14.6 7.6 Z"
            fill="#fde047"
          />
        </g>
      ))}

      {/* Moyeu central noir profond avec écrous */}
      <circle cx="17" cy="17" r="4.2" fill="#09090b" stroke="#facc15" strokeWidth="0.6" />

      {/* 5 écrous chromés */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <circle
          key={angle}
          cx="17"
          cy="14.3"
          r="0.6"
          fill="#e4e4e7"
          transform={`rotate(${angle} 17 17)`}
        />
      ))}

      {/* Logo central miniature au cœur de la jante */}
      <circle cx="17" cy="17" r="1.6" fill="#facc15" />
      <circle cx="17" cy="17" r="1" fill="#09090b" />
    </svg>
  );
}
