import styles from "./PhotoSlot.module.css";

// A designed "photo to come" panel. Hatching is the drawing convention for
// "to be supplied", so it reads as intentional, and it says exactly what to shoot.

interface Props {
  want: string;
  file: string;
  label?: string;
  ratio?: string;
  tone?: "light" | "dark";
  className?: string;
}

export function PhotoSlot({ want, file, label = "Photo to come", ratio = "4 / 5", tone = "light", className }: Props) {
  return (
    <div
      className={`${styles.slot} ${tone === "dark" ? styles.dark : ""} ${className ?? ""}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={`Placeholder for a photo: ${want}`}
    >
      <span className={styles.corner} aria-hidden="true" />
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.want}>{want}</span>
        <code className={styles.file}>{file}</code>
      </div>
    </div>
  );
}
