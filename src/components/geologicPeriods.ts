import { GeologicPeriodInfo } from '../types';

export const GEOLOGIC_PERIODS: GeologicPeriodInfo[] = [
  // PRECAMBRIAN
  {
    name: "Précambrien",
    era: "Précambrien",
    duration: "4600 - 541 Ma",
    description: "Formation de la Terre et apparition des premières formes de vie (bactéries, stromatolithes).",
    details: "La plus longue période de l'histoire de la Terre (près de 90 % du temps géologique). C'est durant cette période qu'apparaissent les premières traces de vie unicellulaire et les premiers organismes pluricellulaires simples (faune de l'Édiacarien).",
    color: "from-slate-900/80 to-slate-800/60"
  },
  // PALEOZOIC
  {
    name: "Cambrien",
    era: "Paléozoïque",
    duration: "541 - 485 Ma",
    description: "Explosion cambrienne, apparition de la plupart des grands embranchements animaux.",
    details: "C'est l'époque de l'explosion de la vie marine. Les trilobites, archéocyathes, et brachiopodes dominent les eaux chaudes peu profondes. Les premiers chordés apparaissent.",
    color: "from-emerald-950/80 to-emerald-900/60"
  },
  {
    name: "Ordovicien",
    era: "Paléozoïque",
    duration: "485 - 443 Ma",
    description: "Invertébrés marins florissants. Premières plantes vertes terrestres.",
    details: "Abondance de trilobites géants, de nautiloïdes et d'orthocères. Le niveau marin très élevé crée de vastes mers épicontinentales favorables à la biodiversité récifale.",
    color: "from-teal-950/80 to-teal-900/60"
  },
  {
    name: "Silurien",
    era: "Paléozoïque",
    duration: "443 - 419 Ma",
    description: "Colonisation de la terre ferme par les plantes vasculaires et arthropodes.",
    details: "Apparition des premiers poissons à mâchoire (gnathostomes). Les scorpions de mer (euryptérides) atteignent des tailles impressionnantes et se positionnent en superprédateurs.",
    color: "from-cyan-950/80 to-cyan-900/60"
  },
  {
    name: "Dévonien",
    era: "Paléozoïque",
    duration: "419 - 358 Ma",
    description: "Âge d'or des poissons. Premiers tétrapodes et forêts primitives.",
    details: "Les placodermes cuirassés dominent les mers, tandis que les premiers amphibiens commencent à marcher sur la terre ferme. Développement des premières graines et d'immenses forêts de fougères.",
    color: "from-sky-950/80 to-sky-900/60"
  },
  {
    name: "Carbonifère",
    era: "Paléozoïque",
    duration: "358 - 298 Ma",
    description: "Forêts luxuriantes géantes. Arthropodes géants et diversification des reptiles.",
    details: "Le gigantisme des insectes est favorisé par un taux d'oxygène exceptionnel (35%). Les arbres tombés s'accumulent sans se décomposer, formant les immenses gisements de charbon d'aujourd'hui.",
    color: "from-blue-950/80 to-blue-900/60"
  },
  {
    name: "Permien",
    era: "Paléozoïque",
    duration: "298 - 252 Ma",
    description: "Supercontinent de la Pangée. Plus grande extinction de masse de l'histoire.",
    details: "Diversification des synapsides (ancêtres des mammifères) comme le Dimétrodon. S'achève par une crise volcanique colossale en Sibérie qui élimine 95% des espèces marines.",
    color: "from-indigo-950/80 to-indigo-900/60"
  },

  // MESOZOIC
  {
    name: "Trias",
    era: "Mésozoïque",
    duration: "252 - 201 Ma",
    description: "Premiers dinosaures, premiers mammifères. Conifères dominantes.",
    details: "La vie panse ses plaies après la crise permienne. Les premiers dinosaures petits et agiles apparaissent aux côtés de reptiles mammaliens et d'ichthyosaures marins.",
    color: "from-amber-950/80 to-amber-905/60"
  },
  {
    name: "Jurassique",
    era: "Mésozoïque",
    duration: "201 - 145 Ma",
    description: "Âge d'or des grands dinosaures. Diversification des ammonites marines.",
    details: "Les sauropodes colossaux arpentent les terres humides. Les cieux sont conquis par les ptérosaures et l'Archéoptéryx, premier dinosaure aviaire. Les ammonites foisonnent dans les océans.",
    color: "from-orange-950/80 to-orange-900/60"
  },
  {
    name: "Crétacé",
    era: "Mésozoïque",
    duration: "145 - 66 Ma",
    description: "Apogée des dinosaures (T-Rex) et extinction K-Pg par astéroïde.",
    details: "Apparition des plantes à fleurs. Les ammonites atteignent une diversité incroyable avant d'être rayées de la carte, en même temps que les dinosaures non-aviens, par un impact d'astéroïde majeur.",
    color: "from-red-950/80 to-red-900/60"
  },

  // CENOZOIC
  {
    name: "Paléogène",
    era: "Cénozoïque",
    duration: "66 - 23 Ma",
    description: "Essor des mammifères et des oiseaux modernes après l'extinction.",
    details: "Le vide écologique laissé par les grands dinosaures permet aux mammifères de se diversifier à un rythme incroyable, colonisant la terre, la mer (baleines) et l'air (chauves-souris).",
    color: "from-yellow-950/80 to-yellow-900/60"
  },
  {
    name: "Néogène",
    era: "Cénozoïque",
    duration: "23 - 2.58 Ma",
    description: "Climat plus frais. Apparition des premiers hominidés.",
    details: "Les mammifères terrestres géants comme le Baluchitherium ou les grands félins à dents de sabre règnent. Les forêts cèdent la place aux grandes savanes herbacées.",
    color: "from-lime-950/80 to-lime-900/60"
  },
  {
    name: "Quaternaire",
    era: "Cénozoïque",
    duration: "2.58 Ma - Présent",
    description: "Cycles glaciaires intenses. Règne du Mammouth et de l'Homme.",
    details: "Période caractérisée par des glaciations successives, la mégafaune du froid (mammouths laineux, rhinocéros laineux) et l'ascension fulgurante du genre Homo à travers le globe.",
    color: "from-emerald-950/80 to-emerald-900/60"
  }
];
