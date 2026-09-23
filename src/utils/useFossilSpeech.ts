import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Fossil } from '../types';
import {
  isWebSpeechSupported,
  buildFossilSpeechSections,
  splitTextIntoSpeechChunks,
  findBestFrenchVoice,
  SpeechSection,
} from './speech';

export interface UseFossilSpeechReturn {
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentSectionIndex: number;
  currentSection: SpeechSection | null;
  sections: SpeechSection[];
  rate: number;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  play: (sectionIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  togglePlayPause: (sectionIndex?: number) => void;
  setRate: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

export function useFossilSpeech(fossil: Fossil): UseFossilSpeechReturn {
  const isSupported = useMemo(() => isWebSpeechSupported(), []);
  const sections = useMemo(() => buildFossilSpeechSections(fossil), [fossil]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(-1);
  const [rate, setRateState] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);

  // References for asynchronous execution inside speech callbacks
  const activeSectionIdxRef = useRef<number>(-1);
  const activeChunkIdxRef = useRef<number>(0);
  const activeChunksRef = useRef<string[]>([]);
  const isStoppedRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(false);
  const rateRef = useRef<number>(1.0);
  const currentVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const sectionsRef = useRef<SpeechSection[]>(sections);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    currentVoiceRef.current = currentVoice;
  }, [currentVoice]);

  // Load voices and auto-select French voice
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
        const bestFrench = findBestFrenchVoice(available);
        setCurrentVoice((prev) => prev || bestFrench);
      }
    };

    updateVoices();

    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    }

    return () => {
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      }
    };
  }, [isSupported]);

  // Clean stop helper
  const internalStop = useCallback(() => {
    isStoppedRef.current = true;
    isPausedRef.current = false;
    activeSectionIdxRef.current = -1;
    activeChunkIdxRef.current = 0;
    activeChunksRef.current = [];

    if (isSupported && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Speech cancellation error:', e);
      }
    }

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSectionIndex(-1);
  }, [isSupported]);

  // Speak a specific chunk index of the active section
  const speakCurrentChunk = useCallback(() => {
    if (!isSupported || isStoppedRef.current || isPausedRef.current) return;

    const sectionIdx = activeSectionIdxRef.current;
    const chunkIdx = activeChunkIdxRef.current;
    const chunks = activeChunksRef.current;

    if (sectionIdx < 0 || sectionIdx >= sectionsRef.current.length || !chunks || chunkIdx >= chunks.length) {
      // Advance to next section if available
      const nextSectionIdx = sectionIdx + 1;
      if (nextSectionIdx < sectionsRef.current.length) {
        activeSectionIdxRef.current = nextSectionIdx;
        activeChunkIdxRef.current = 0;
        activeChunksRef.current = splitTextIntoSpeechChunks(sectionsRef.current[nextSectionIdx].text);
        setCurrentSectionIndex(nextSectionIdx);
        speakCurrentChunk();
      } else {
        // Finished all sections!
        internalStop();
      }
      return;
    }

    const chunkText = chunks[chunkIdx];
    if (!chunkText || !chunkText.trim()) {
      activeChunkIdxRef.current++;
      speakCurrentChunk();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = 'fr-FR';
      utterance.rate = rateRef.current;
      utterance.pitch = 1.0;
      if (currentVoiceRef.current) {
        utterance.voice = currentVoiceRef.current;
      }

      utterance.onstart = () => {
        if (!isStoppedRef.current) {
          setIsPlaying(true);
          setIsPaused(false);
        }
      };

      utterance.onend = () => {
        if (isStoppedRef.current || isPausedRef.current) return;
        // Next chunk
        activeChunkIdxRef.current++;
        speakCurrentChunk();
      };

      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' happens naturally when user pauses/stops or navigates
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.warn('SpeechSynthesis error on chunk:', e.error);
        if (!isStoppedRef.current) {
          activeChunkIdxRef.current++;
          speakCurrentChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to speak utterance:', err);
      internalStop();
    }
  }, [isSupported, internalStop]);

  // Start playing from a given section index (or 0)
  const play = useCallback(
    (targetSectionIndex = 0) => {
      if (!isSupported || sectionsRef.current.length === 0) return;

      // Cancel any ongoing speech
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn(e);
      }

      const validIdx = Math.max(0, Math.min(targetSectionIndex, sectionsRef.current.length - 1));
      isStoppedRef.current = false;
      isPausedRef.current = false;
      activeSectionIdxRef.current = validIdx;
      activeChunkIdxRef.current = 0;
      activeChunksRef.current = splitTextIntoSpeechChunks(sectionsRef.current[validIdx].text);

      setCurrentSectionIndex(validIdx);
      setIsPlaying(true);
      setIsPaused(false);

      // Brief tick to allow browser speech engine queue clearance
      setTimeout(() => {
        if (!isStoppedRef.current) {
          speakCurrentChunk();
        }
      }, 30);
    },
    [isSupported, speakCurrentChunk]
  );

  // Pause speech
  const pause = useCallback(() => {
    if (!isSupported || !isPlaying || isPaused) return;

    try {
      window.speechSynthesis.pause();
      isPausedRef.current = true;
      setIsPaused(true);
      setIsPlaying(false);
    } catch (e) {
      console.warn('Pause error:', e);
    }
  }, [isSupported, isPlaying, isPaused]);

  // Resume speech
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;

    try {
      isPausedRef.current = false;
      setIsPaused(false);
      setIsPlaying(true);

      // On some mobile browsers, window.speechSynthesis.resume() is buggy if paused for too long.
      // If resume() doesn't restart playback within 200ms, retry with current chunk
      window.speechSynthesis.resume();
      setTimeout(() => {
        if (isPausedRef.current) return;
        if (!window.speechSynthesis.speaking) {
          speakCurrentChunk();
        }
      }, 150);
    } catch (e) {
      console.warn('Resume error:', e);
      speakCurrentChunk();
    }
  }, [isSupported, isPaused, speakCurrentChunk]);

  // Toggle play/pause
  const togglePlayPause = useCallback(
    (targetSectionIndex?: number) => {
      if (isPlaying) {
        pause();
      } else if (isPaused) {
        resume();
      } else {
        play(targetSectionIndex ?? 0);
      }
    },
    [isPlaying, isPaused, pause, resume, play]
  );

  // Set playback rate
  const setRate = useCallback((newRate: number) => {
    const clamped = Math.max(0.75, Math.min(newRate, 1.5));
    rateRef.current = clamped;
    setRateState(clamped);
  }, []);

  // Set selected voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    currentVoiceRef.current = voice;
    setCurrentVoice(voice);
  }, []);

  // Stop when changing fossil or unmounting
  useEffect(() => {
    internalStop();
    return () => {
      internalStop();
    };
  }, [fossil.id, internalStop]);

  const currentSection =
    currentSectionIndex >= 0 && currentSectionIndex < sections.length
      ? sections[currentSectionIndex]
      : null;

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentSectionIndex,
    currentSection,
    sections,
    rate,
    voices,
    currentVoice,
    play,
    pause,
    resume,
    stop: internalStop,
    togglePlayPause,
    setRate,
    setVoice,
  };
}
