import styles from "./Hero.module.css";

// Bottom of the hero: the pole comes down to a hose that runs across the lawn to the
// tank on its cart. Drawn plainly, like a contractor's sketch of the setup.

export function Rig() {
  return (
    <div className={styles.rig} aria-hidden="true">
      <svg className={styles.hose} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M0 60 C0 96 6 99 22 99 S48 93 58 98 S88 99 94 80 S100 40 100 32"
          fill="none"
          stroke="#1b2129"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <path
          d="M0 60 C0 96 6 99 22 99 S48 93 58 98 S88 99 94 80 S100 40 100 32"
          fill="none"
          stroke="#4f5a66"
          strokeWidth="1.2"
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figure className={styles.tank}>
        <svg viewBox="0 0 120 140" width="120" height="140">
          <path d="M100 120 L111 12" fill="none" stroke="var(--navy)" strokeWidth="3" strokeLinecap="round" />
          <path d="M105 12 H118" fill="none" stroke="#1b2129" strokeWidth="5" strokeLinecap="round" />
          <rect x="22" y="26" width="76" height="90" rx="5" fill="#e6eaed" stroke="var(--navy)" strokeWidth="1.5" />
          <rect x="22" y="26" width="18" height="90" fill="#f8f9fa" />
          <rect x="80" y="26" width="18" height="90" fill="#cdd4da" />
          <rect x="22" y="26" width="76" height="90" rx="5" fill="none" stroke="var(--navy)" strokeWidth="1.5" />
          <path d="M22 48H98M22 96H98" stroke="var(--navy)" strokeWidth="1.2" />
          <rect x="18" y="18" width="84" height="10" rx="2" fill="var(--navy)" />
          <rect x="44" y="10" width="32" height="9" rx="2" fill="#3b4652" />
          <rect x="44" y="62" width="32" height="16" fill="#fff" stroke="var(--navy)" strokeWidth="1" />
          <path d="M49 67h22M49 72h14" stroke="var(--sky-ink)" strokeWidth="1.6" />
          <rect x="12" y="58" width="12" height="12" rx="2" fill="#1b2129" />
          <path d="M18 116V122M102 116V122" stroke="var(--navy)" strokeWidth="2" />
          <path d="M14 122H106" stroke="var(--navy)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="128" r="10" fill="#1b2129" />
          <circle cx="32" cy="128" r="3.5" fill="#cdd4da" />
          <circle cx="88" cy="128" r="10" fill="#1b2129" />
          <circle cx="88" cy="128" r="3.5" fill="#cdd4da" />
        </svg>
        <figcaption className={styles.tankNote}>Sealed tank. It all ends up in here.</figcaption>
      </figure>
      <span className={styles.ground} />
    </div>
  );
}
