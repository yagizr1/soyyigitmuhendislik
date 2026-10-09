export function ProfileArt({
  shape = "kutu",
  className = "",
}: {
  shape?: string | null;
  className?: string;
}) {
  const kind = shape ?? "kutu";
  return (
    <svg viewBox="0 0 240 180" className={className} role="img" aria-hidden="true">
      <rect width="240" height="180" fill="#e7ebef" />
      {kind === "lama" ? (
        <rect x="36" y="72" width="168" height="36" fill="none" stroke="#1e242b" strokeWidth="14" />
      ) : kind === "kosebent" ? (
        <path d="M48 40 H108 V78 H192 V132 H48 Z" fill="none" stroke="#1e242b" strokeWidth="14" />
      ) : kind === "dikdortgen" ? (
        <rect x="28" y="48" width="184" height="84" fill="none" stroke="#1e242b" strokeWidth="16" />
      ) : (
        <rect x="48" y="28" width="144" height="124" fill="none" stroke="#1e242b" strokeWidth="16" />
      )}
      <rect x="18" y="150" width="46" height="6" fill="#a33b12" />
    </svg>
  );
}
