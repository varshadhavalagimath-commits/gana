export interface MoodItem {
  emoji: string;
  labelKey: string;
}

export const MOODS: MoodItem[] = [
  { emoji: '🔥', labelKey: 'mood.energetic' },
  { emoji: '🌧️', labelKey: 'mood.lofi' },
  { emoji: '😴', labelKey: 'mood.sleep' },
  { emoji: '💔', labelKey: 'mood.heartbreak' },
  { emoji: '🚀', labelKey: 'mood.focus' },
  { emoji: '💃', labelKey: 'mood.party' },
  { emoji: '❤️', labelKey: 'mood.love' },
  { emoji: '🤝', labelKey: 'mood.friendship' },
  { emoji: '🥺', labelKey: 'mood.struggle' },
  { emoji: '🎯', labelKey: 'mood.motivating' },
  { emoji: '🎧', labelKey: 'mood.vibing' },
  { emoji: '😊', labelKey: 'mood.happy' },
  { emoji: '🌀', labelKey: 'mood.mixed' },
  { emoji: '😎', labelKey: 'mood.cool' },
  { emoji: '😢', labelKey: 'mood.sad' },
  { emoji: '😡', labelKey: 'mood.angry' },
  { emoji: '🤔', labelKey: 'mood.thoughtful' },
  { emoji: '🎵', labelKey: 'mood.melancholy' },
  { emoji: '🌈', labelKey: 'mood.colorful' },
  { emoji: '🌌', labelKey: 'mood.cosmic' },
  { emoji: '🌊', labelKey: 'mood.relaxing' },
  { emoji: '👑', labelKey: 'mood.God' },
  { emoji: '🫂', labelKey: 'mood.comforting' },
  { emoji: '🫀', labelKey: 'mood.heartfelt' },
];

/**
 * Returns the human-readable mood name.
 * If a translation function t is provided, it extracts the label name after the emoji.
 * Otherwise, it formats the label key suffix (e.g. "comforting" -> "Comforting").
 */
export function getMoodName(emoji: string, t?: (key: string) => string): string {
  const item = MOODS.find((m) => m.emoji === emoji);
  if (!item) return '';

  if (t) {
    const raw = t(item.labelKey);
    if (raw && raw !== item.labelKey) {
      const parts = raw.split(' ');
      if (parts.length > 1) {
        return parts.slice(1).join(' ');
      }
      return raw;
    }
  }

  const fallback = item.labelKey.replace('mood.', '');
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}
