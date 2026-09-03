/**
 * Utility functions for fossil title formatting and responsive sizing.
 * Ensures paleontological names (such as Carcharodontosaure, Rebbachisaurus, Edmontosaurus)
 * are always fully visible on mobile screens without being cut off or overflowing.
 */

export function getAdaptiveTitleClasses(title: string = ''): string {
  const words = title.trim().split(/\s+/);
  const maxWordLength = words.reduce((max, w) => Math.max(max, w.length), 0);
  const totalLength = title.length;

  if (maxWordLength >= 15 || totalLength >= 35) {
    // Very long scientific or genus names (e.g. "Carcharodontosaure" = 18 chars)
    return 'text-xl sm:text-2xl md:text-4xl lg:text-5xl';
  }
  if (maxWordLength >= 12 || totalLength >= 25) {
    // Medium-long names (e.g. "Rebbachisaurus", "Edmontosaurus", "Siroccopteryx" = 13-14 chars)
    return 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
  }
  return 'text-3xl sm:text-4xl md:text-5xl';
}
