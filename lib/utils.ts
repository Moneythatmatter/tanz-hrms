export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function safeGetStorage<T>(key: string, fallback: T, isSession = false): T {
  if (typeof window === "undefined") return fallback;
  try {
    const storage = isSession ? sessionStorage : localStorage;
    const item = storage.getItem(key);
    if (!item) return fallback;
    return (JSON.parse(item) as T) ?? fallback;
  } catch (error) {
    console.error(`Error parsing storage key "${key}":`, error);
    return fallback;
  }
}

export function safeSetStorage<T>(key: string, value: T, isSession = false): void {
  if (typeof window === "undefined") return;
  try {
    const storage = isSession ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing storage key "${key}":`, error);
  }
}

export function safeRemoveStorage(key: string, isSession = false): void {
  if (typeof window === "undefined") return;
  try {
    const storage = isSession ? sessionStorage : localStorage;
    storage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage key "${key}":`, error);
  }
}
