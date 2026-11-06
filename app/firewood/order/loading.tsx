import styles from "@/components/firewood/Firewood.module.css";

// Shown while the order page asks Stripe and the database how the order stands: the same card,
// as skeleton bars, so the real page drops into place instead of appearing from a blank screen.

export default function OrderLoading() {
  return (
    <div data-season="firewood" className={styles.orderPage}>
      <main id="main" className={styles.orderCard} aria-busy="true">
        <p className="vh">Checking your order…</p>
        <div aria-hidden="true">
          <span className="skel" style={{ width: 150, height: 51, marginBottom: 40 }} />
          <span className="skel" style={{ width: "30%", marginBottom: 14 }} />
          <span className="skel" style={{ width: "80%", height: "2.6rem", marginBottom: 22 }} />
          <span className="skel" style={{ width: "65%", marginBottom: 10 }} />
          <span className="skel" style={{ width: "90%", marginBottom: 32 }} />
          {[0, 1, 2].map((i) => (
            <span key={i} className="skel" style={{ width: "100%", height: "1.3em", marginBottom: 10 }} />
          ))}
        </div>
      </main>
    </div>
  );
}
