import React from 'react';
import { 
  Bug, 
  Leaf, 
  Shell, 
  Fish, 
  Drumstick, 
  Utensils, 
  Waves, 
  Sparkles, 
  Skull, 
  Recycle, 
  Shrimp, 
  HelpCircle,
  Check
} from 'lucide-react';
import { DIET_CATEGORIES, DietCategoryName } from '../types';
import { playDinoSound } from '../utils/data/audio';

interface DietIconProps {
  name: string;
  className?: string;
}

export function DietIcon({ name, className = 'w-4 h-4' }: DietIconProps) {
  switch (name) {
    case 'Insectivore':
      return <Bug className={className} />;
    case 'Herbivore':
      return <Leaf className={className} />;
    case 'Molluscivore':
      return <Shell className={className} />;
    case 'Piscivore':
      return <Fish className={className} />;
    case 'Carnivore':
      return <Drumstick className={className} />;
    case 'Omnivore':
      return <Utensils className={className} />;
    case 'Suspensivore':
      return <Waves className={className} />;
    case 'Planctonivore':
      return <Sparkles className={className} />;
    case 'Charognard':
      return <Skull className={className} />;
    case 'Detritivore':
      return <Recycle className={className} />;
    case 'Crustacivore':
      return <Shrimp className={className} />;
    case 'Alimentation inconnu':
    default:
      return <HelpCircle className={className} />;
  }
}

interface DietSelectorProps {
  selectedDiets: string[];
  onChange: (updatedDiets: string[]) => void;
}

export function DietSelector({ selectedDiets = [], onChange }: DietSelectorProps) {
  const toggleDiet = (dietId: string) => {
    playDinoSound();
    const isSelected = selectedDiets.includes(dietId);
    if (isSelected) {
      onChange(selectedDiets.filter(id => id !== dietId));
    } else {
      onChange([...selectedDiets, dietId]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono text-yellow-400 font-medium">
          Régime alimentaire (sélectionnez une ou plusieurs catégories) :
        </label>
        <span className="text-[10.5px] font-mono text-slate-400">
          {selectedDiets.length} sélectionné{selectedDiets.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {DIET_CATEGORIES.map((category) => {
          const isChecked = selectedDiets.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleDiet(category.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all border cursor-pointer select-none ${
                isChecked
                  ? 'bg-yellow-500/15 border-yellow-500/60 text-white shadow-sm ring-1 ring-yellow-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                  isChecked
                    ? 'bg-yellow-500 border-yellow-500 text-slate-950'
                    : 'border-slate-600 bg-slate-950/60'
                }`}
              >
                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              <div className={`p-1 rounded shrink-0 ${isChecked ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-500'}`}>
                <DietIcon name={category.id} className="w-4 h-4" />
              </div>

              <span className={`text-xs font-medium truncate ${isChecked ? 'text-yellow-200 font-semibold' : 'text-slate-300'}`}>
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DietBadgesProps {
  dietTypes?: string[];
  className?: string;
}

export function DietBadges({ dietTypes = [], className = '' }: DietBadgesProps) {
  if (!dietTypes || dietTypes.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 ${className}`}>
      {dietTypes.map((diet) => (
        <div
          key={diet}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-yellow-600/30 text-yellow-300 shadow-sm text-xs sm:text-sm font-medium tracking-wide transition-transform hover:scale-105 select-none"
        >
          <span className="p-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <DietIcon name={diet} className="w-4 h-4" />
          </span>
          <span className="font-serif tracking-wide">{diet}</span>
        </div>
      ))}
    </div>
  );
}
