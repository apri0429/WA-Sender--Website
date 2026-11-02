// Initials avatar for table rows. The colour comes from the name, so the same
// customer always gets the same colour, and different customers look different.
// Soft tinted gradient + deeper text of the same hue: calm, modern, readable.
const COLORS = [
  ["#e0f2fe", "#bae6fd", "#0369a1"], // sky
  ["#ede9fe", "#ddd6fe", "#6d28d9"], // violet
  ["#fce7f3", "#fbcfe8", "#be185d"], // pink
  ["#ffedd5", "#fed7aa", "#c2410c"], // orange
  ["#dcfce7", "#bbf7d0", "#15803d"], // green
  ["#ccfbf1", "#99f6e4", "#0f766e"], // teal
  ["#fef3c7", "#fde68a", "#b45309"], // amber
  ["#fee2e2", "#fecaca", "#b91c1c"], // red
  ["#e0e7ff", "#c7d2fe", "#4338ca"], // indigo
  ["#fae8ff", "#f5d0fe", "#a21caf"], // fuchsia
];

function colorFor(seed) {
  const text = String(seed ?? "").trim().toLowerCase();
  // FNV-1a: spreads similar names ("PT ...", "CV ...") across the palette.
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const [from, to, ink] = COLORS[hash % COLORS.length];
  return { background: `linear-gradient(135deg, ${from}, ${to})`, color: ink };
}

export default function Avatar({ seed, initials, size = 30 }) {
  return (
    <span
      className="users-table__avatar"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        ...colorFor(seed),
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7), 0 1px 2px rgba(15,23,42,0.1)",
        fontSize: Math.round(size * 0.34),
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
