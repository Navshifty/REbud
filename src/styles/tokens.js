/*
  Design tokens for REbud.

  The prototype styles components with inline `style` objects, so the
  palette and type stacks live here as plain JS. The same values are
  registered with Tailwind in src/index.css (@theme) for utility use.

  ink   #1C2B45   cream #F3EEE3   black #17160F   soft-blue #E4EBF3
  line  #D8D2C2   blue-mid #35507A  accent-ok #4B6B4A  accent-warn #A3492B
*/

export const T = {
  ink: "#1C2B45",
  inkSoft: "#35507A",
  cream: "#F3EEE3",
  creamDim: "#EAE3D2",
  black: "#17160F",
  line: "#D8D2C2",
  softBlue: "#E4EBF3",
  softBlueLine: "#C7D5E6",
  warn: "#A3492B",
  ok: "#4B6B4A",
};

export const serif = { fontFamily: "'Source Serif 4', 'Iowan Old Style', Georgia, serif" };
export const sans = { fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif" };
export const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };
