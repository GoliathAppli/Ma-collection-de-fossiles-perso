import React, { useState, useRef, useMemo } from 'react';
import { DETAILED_GEOLOGICAL_DATA } from './DetailedGeologicTimeline';
import { playDinoSound } from '../utils/data/audio';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Info,
  X,
  Clock,
} from 'lucide-react';

interface FlattenedPeriod {
  id: string;
  name: string;
  altName?: string;
  duration: string;
  description?: string;
  eraId: string;
  eraName: string;
  eraNumber: number;
  eraColor: {
    badge: string;
    border: string;
    bgGradient: string;
    text: string;
    subBadge: string;
    accent: string;
  };
  epochs?: {
    name: string;
    duration?: string;
    stages: string[];
    description?: string;
  }[];
  highlights?: string[];
  isPrecambrianEon?: boolean;
}

export default function DetailedHorizontalTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [activeModalPeriod, setActiveModalPeriod] = useState<FlattenedPeriod | null>(null);

  // Flatten the 4 eras into a continuous chronological sequence of periods/eons
  const flattenedTimeline: FlattenedPeriod[] = useMemo(() => {
    const list: FlattenedPeriod[] = [];

    DETAILED_GEOLOGICAL_DATA.forEach((era) => {
      if (era.id === 'precambrian' && era.eons) {
        era.eons.forEach((eon) => {
          list.push({
            id: `precambrian-${eon.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: eon.name,
            altName: 'Éon du Précambrien (Super-éon)',
            duration: eon.duration,
            description: eon.description,
            eraId: era.id,
            eraName: era.name,
            eraNumber: era.number,
            eraColor: era.color,
            highlights: eon.highlights,
            isPrecambrianEon: true,
          });
        });
      } else if (era.periods) {
        era.periods.forEach((period) => {
          list.push({
            id: `${era.id}-${period.id}`,
            name: period.name,
            altName: period.altName,
            duration: period.duration,
            description: period.description,
            eraId: era.id,
            eraName: era.name,
            eraNumber: era.number,
            eraColor: era.color,
            epochs: period.epochs,
          });
        });
      }
    });

    return list;
  }, []);

  const scrollLeft = () => {
    playDinoSound();
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    playDinoSound();
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const toggleExpand = (id: string) => {
    playDinoSound();
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandAll = () => {
    playDinoSound();
    const allExpanded = flattenedTimeline.every((item) => expandedCards[item.id]);
    const newState: Record<string, boolean> = {};
    flattenedTimeline.forEach((item) => {
      newState[item.id] = !allExpanded;
    });
    setExpandedCards(newState);
  };

  return (
    <div className="space-y-4 w-full text-slate-100">
      {/* Header with Title and Scroll / Expand controls */}
      <div className="bg-slate-950/80 border border-yellow-700/30 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-yellow-600/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)] shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-extrabold uppercase tracking-wide bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(234,179,8,0.25)]">
              Échelle Stratigraphique Mondiale Complète
            </h2>
            <p className="text-xs sm:text-sm text-amber-300/80 font-mono italic mt-0.5">
              Chronologie internationale des ères, périodes et étages
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={toggleExpandAll}
            type="button"
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {flattenedTimeline.every((item) => expandedCards[item.id])
              ? 'Tout replier'
              : 'Tout déplier'}
          </button>
          <div className="h-6 w-px bg-slate-800 mx-1" />
          <button
            onClick={scrollLeft}
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-300 hover:text-yellow-400 transition-all shadow-md active:scale-95"
            title="Faire défiler vers le passé"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-300 hover:text-yellow-400 transition-all shadow-md active:scale-95"
            title="Faire défiler vers le présent"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL SCROLLING TRACK */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto py-3 px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {flattenedTimeline.map((item) => {
            const isExpanded = !!expandedCards[item.id];
            const totalStagesCount =
              item.epochs?.reduce((acc, ep) => acc + ep.stages.length, 0) || 0;

            return (
              <div
                key={item.id}
                className={`flex-none w-80 sm:w-96 snap-start rounded-2xl border transition-all duration-300 bg-gradient-to-b ${item.eraColor.bgGradient} ${
                  isExpanded
                    ? 'border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30'
                    : 'border-slate-800/80 hover:border-slate-700'
                } p-5 flex flex-col justify-between select-none relative overflow-hidden`}
              >
                {/* Accent Top Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    item.eraId === 'precambrian'
                      ? 'bg-emerald-500'
                      : item.eraId === 'paleozoic'
                      ? 'bg-amber-500'
                      : item.eraId === 'mesozoic'
                      ? 'bg-orange-500'
                      : 'bg-yellow-500'
                  }`}
                />

                <div className="space-y-3.5">
                  {/* Era Badge & Duration */}
                  <div className="flex justify-between items-start gap-2 pt-1">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${item.eraColor.badge}`}
                    >
                      {item.eraName}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-yellow-400/90 bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-slate-800 whitespace-nowrap">
                      {item.duration}
                    </span>
                  </div>

                  {/* Period Name & Subtitle */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-extrabold text-white tracking-wide">
                      {item.name}
                    </h3>
                    {item.altName && (
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">
                        {item.altName}
                      </span>
                    )}
                  </div>

                  {/* Summary description */}
                  {item.description && (
                    <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* PRECAMBRIAN HIGHLIGHTS */}
                  {item.isPrecambrianEon && item.highlights && (
                    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block font-semibold">
                        Faits marquants de l'éon :
                      </span>
                      <ul className="space-y-1">
                        {item.highlights.map((hl, hIdx) => (
                          <li
                            key={hIdx}
                            className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug"
                          >
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* DEPLIANT: EPOCHS & STAGES LIST */}
                  {item.epochs && item.epochs.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all group"
                      >
                        <span className="flex items-center gap-1.5 text-yellow-400/90 font-semibold">
                          <Layers className="w-3.5 h-3.5" />
                          {isExpanded
                            ? 'Masquer les étages'
                            : `Déplier ${item.epochs.length} époques (${totalStagesCount} étages)`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                        )}
                      </button>

                      {/* Expandable Accordion Body */}
                      {isExpanded && (
                        <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 space-y-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                          {item.epochs.map((epoch, epIdx) => (
                            <div
                              key={epIdx}
                              className="border-b border-slate-850 pb-2.5 last:border-b-0 last:pb-0 space-y-1.5"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-serif font-bold text-slate-200">
                                  {epoch.name}
                                </span>
                                {epoch.duration && (
                                  <span className="text-[9px] font-mono text-slate-500">
                                    {epoch.duration}
                                  </span>
                                )}
                              </div>

                              {/* Stage tags */}
                              <div className="flex flex-wrap gap-1">
                                {epoch.stages.map((stage, sIdx) => {
                                  const isSpecial =
                                    stage.includes('actuelle') ||
                                    stage.includes('Maastrichtien') ||
                                    stage.includes('Toarcien');
                                  return (
                                    <span
                                      key={sIdx}
                                      className={`text-[10px] px-2 py-0.5 rounded font-sans transition-colors ${
                                        isSpecial
                                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold'
                                          : 'bg-slate-900 border border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {stage}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer with Modal detail button */}
                <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    {item.epochs
                      ? `${item.epochs.length} époques • ${totalStagesCount} étages`
                      : 'Éon Précambrien'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModalPeriod(item)}
                    className="flex items-center gap-1 text-[11px] font-mono text-yellow-400 hover:text-yellow-300 hover:underline"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Vue complète
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* DETAILED MODAL SHEET */}
      {activeModalPeriod && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setActiveModalPeriod(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${activeModalPeriod.eraColor.badge}`}
              >
                {activeModalPeriod.eraName}
              </span>
              <h2 className="text-2xl font-serif font-extrabold text-white">
                {activeModalPeriod.name}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-yellow-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeModalPeriod.duration}</span>
                {activeModalPeriod.altName && (
                  <span className="text-slate-400">({activeModalPeriod.altName})</span>
                )}
              </div>
            </div>

            {activeModalPeriod.description && (
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                {activeModalPeriod.description}
              </p>
            )}

            {/* Highlights if any */}
            {activeModalPeriod.highlights && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Événements géologiques & biologiques majeurs :
                </h4>
                <ul className="space-y-2">
                  {activeModalPeriod.highlights.map((hl, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-850"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Epochs & Stages list */}
            {activeModalPeriod.epochs && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-semibold">
                  Découpage Stratigraphique Officiel :
                </h4>
                <div className="space-y-3">
                  {activeModalPeriod.epochs.map((ep, i) => (
                    <div
                      key={i}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-serif font-bold text-white">
                          {ep.name}
                        </span>
                        {ep.duration && (
                          <span className="text-xs font-mono text-yellow-500/90">
                            {ep.duration}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ep.stages.map((st, j) => (
                          <span
                            key={j}
                            className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalPeriod(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 hover:text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
