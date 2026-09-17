export type PicoKeyId =
  | "UP"
  | "DOWN"
  | "LEFT"
  | "RIGHT"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "ESC"
  | "TAB"
  | "CAPS"
  | "DEL"
  | "BKSP"
  | "ENTER"
  | "SHL"
  | "SHR"
  | "CTRL"
  | "ALT"
  | "PWR"
  | string;

export interface PicoKey {
  id: PicoKeyId;
  label: string;
  shiftLabel?: string;
  wide?: number;
  char?: string;
  shiftChar?: string;
}

export interface KeyEvent {
  id: PicoKeyId;
  char: string;
  shift: boolean;
  caps: boolean;
  ctrl: boolean;
  alt: boolean;
  repeat: boolean;
}

export const SHIFT_MAP: Record<string, string> = {
  "`": "~",
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
  "-": "_",
  "=": "+",
  "[": "{",
  "]": "}",
  "\\": "|",
  ";": ":",
  "'": '"',
  ",": "<",
  ".": ">",
  "/": "?",
};

/** Physical PicoCalc 67-key layout used by the official keyboard tester. */
export const KEY_ROWS: PicoKey[][] = [
  [
    { id: "UP", label: "↑" },
    { id: "F1", label: "F1" },
    { id: "F2", label: "F2" },
    { id: "F3", label: "F3" },
    { id: "F4", label: "F4" },
    { id: "F5", label: "F5" },
  ],
  [
    { id: "LEFT", label: "←" },
    { id: "RIGHT", label: "→" },
    { id: "ESC", label: "Esc" },
    { id: "TAB", label: "Tab" },
    { id: "CAPS", label: "Caps" },
    { id: "DEL", label: "Del" },
    { id: "BKSP", label: "Bksp" },
  ],
  [
    { id: "DOWN", label: "↓" },
    { id: "`", label: "`", shiftLabel: "~", char: "`", shiftChar: "~" },
    { id: "/", label: "/", shiftLabel: "?", char: "/", shiftChar: "?" },
    { id: "\\", label: "\\", shiftLabel: "|", char: "\\", shiftChar: "|" },
    { id: "-", label: "-", shiftLabel: "_", char: "-", shiftChar: "_" },
    { id: "=", label: "=", shiftLabel: "+", char: "=", shiftChar: "+" },
    { id: "[", label: "[", shiftLabel: "{", char: "[", shiftChar: "{" },
    { id: "]", label: "]", shiftLabel: "}", char: "]", shiftChar: "}" },
  ],
  [
    { id: "1", label: "1", shiftLabel: "!", char: "1", shiftChar: "!" },
    { id: "2", label: "2", shiftLabel: "@", char: "2", shiftChar: "@" },
    { id: "3", label: "3", shiftLabel: "#", char: "3", shiftChar: "#" },
    { id: "4", label: "4", shiftLabel: "$", char: "4", shiftChar: "$" },
    { id: "5", label: "5", shiftLabel: "%", char: "5", shiftChar: "%" },
    { id: "6", label: "6", shiftLabel: "^", char: "6", shiftChar: "^" },
    { id: "7", label: "7", shiftLabel: "&", char: "7", shiftChar: "&" },
    { id: "8", label: "8", shiftLabel: "*", char: "8", shiftChar: "*" },
    { id: "9", label: "9", shiftLabel: "(", char: "9", shiftChar: "(" },
    { id: "0", label: "0", shiftLabel: ")", char: "0", shiftChar: ")" },
  ],
  [
    { id: "Q", label: "Q", char: "q", shiftChar: "Q" },
    { id: "W", label: "W", char: "w", shiftChar: "W" },
    { id: "E", label: "E", char: "e", shiftChar: "E" },
    { id: "R", label: "R", char: "r", shiftChar: "R" },
    { id: "T", label: "T", char: "t", shiftChar: "T" },
    { id: "Y", label: "Y", char: "y", shiftChar: "Y" },
    { id: "U", label: "U", char: "u", shiftChar: "U" },
    { id: "I", label: "I", char: "i", shiftChar: "I" },
    { id: "O", label: "O", char: "o", shiftChar: "O" },
    { id: "P", label: "P", char: "p", shiftChar: "P" },
  ],
  [
    { id: "A", label: "A", char: "a", shiftChar: "A" },
    { id: "S", label: "S", char: "s", shiftChar: "S" },
    { id: "D", label: "D", char: "d", shiftChar: "D" },
    { id: "F", label: "F", char: "f", shiftChar: "F" },
    { id: "G", label: "G", char: "g", shiftChar: "G" },
    { id: "H", label: "H", char: "h", shiftChar: "H" },
    { id: "J", label: "J", char: "j", shiftChar: "J" },
    { id: "K", label: "K", char: "k", shiftChar: "K" },
    { id: "L", label: "L", char: "l", shiftChar: "L" },
  ],
  [
    { id: "Z", label: "Z", char: "z", shiftChar: "Z" },
    { id: "X", label: "X", char: "x", shiftChar: "X" },
    { id: "C", label: "C", char: "c", shiftChar: "C" },
    { id: "V", label: "V", char: "v", shiftChar: "V" },
    { id: "B", label: "B", char: "b", shiftChar: "B" },
    { id: "N", label: "N", char: "n", shiftChar: "N" },
    { id: "M", label: "M", char: "m", shiftChar: "M" },
    { id: ",", label: ",", shiftLabel: "<", char: ",", shiftChar: "<" },
    { id: ".", label: ".", shiftLabel: ">", char: ".", shiftChar: ">" },
    { id: "ENTER", label: "Ent" },
  ],
  [
    { id: "SHL", label: "Sft" },
    { id: "CTRL", label: "Ctrl" },
    { id: "ALT", label: "Alt" },
    { id: " ", label: "Space", char: " ", wide: 3 },
    { id: ";", label: ";", shiftLabel: ":", char: ";", shiftChar: ":" },
    { id: "'", label: "'", shiftLabel: '"', char: "'", shiftChar: '"' },
    { id: "SHR", label: "Sft" },
  ],
];

const HOST_TO_PICO: Record<string, PicoKeyId> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  Escape: "ESC",
  Tab: "TAB",
  CapsLock: "CAPS",
  Delete: "DEL",
  Backspace: "BKSP",
  Enter: "ENTER",
  ShiftLeft: "SHL",
  ShiftRight: "SHR",
  ControlLeft: "CTRL",
  ControlRight: "CTRL",
  AltLeft: "ALT",
  AltRight: "ALT",
  " ": " ",
  Space: " ",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
};

export function hostEventToPicoId(e: KeyboardEvent): PicoKeyId | null {
  if (HOST_TO_PICO[e.code]) return HOST_TO_PICO[e.code];
  if (HOST_TO_PICO[e.key]) return HOST_TO_PICO[e.key];
  if (e.key.length === 1) {
    const upper = e.key.toUpperCase();
    if (/^[A-Z0-9]$/.test(upper)) return upper;
    return e.key;
  }
  return null;
}

export function findKey(id: PicoKeyId): PicoKey | undefined {
  for (const row of KEY_ROWS) {
    const hit = row.find((k) => k.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function resolveChar(key: PicoKey, shift: boolean, caps: boolean): string {
  if (key.char && /[a-z]/i.test(key.char)) {
    const upper = shift !== caps;
    return upper ? (key.shiftChar ?? key.char.toUpperCase()) : key.char;
  }
  if (shift) return key.shiftChar ?? key.char ?? "";
  return key.char ?? "";
}
