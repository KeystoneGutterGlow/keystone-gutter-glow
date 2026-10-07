import type { Metadata } from "next";
import { Footer } from "@/components/footer/Footer";
import { Keystone } from "@/components/Keystone";
import { MobileNav } from "@/components/nav/MobileNav";
import { Rail } from "@/components/nav/Rail";
import type { NavItem } from "@/content/nav";
import { referral } from "@/content/referral";
import { allowIndexing } from "@/lib/env";
import { site } from "@/content/site";
import styles from "./referred.module.css";

// Placeholder-first referral page. The program isn't designed yet, so this lays out the
// pieces it will probably need (reward, steps, a way to refer, status, questions) without
// committing to any of them. All copy lives in content/referral.ts.

export const metadata: Metadata = {
  title: "Refer a neighbor",
  description: "Send a neighbor to Keystone Gutter Glow for vacuum gutter cleaning in Bucks County.",
  alternates: { canonical: "/referred" },
  robots: referral.indexable && allowIndexing ? undefined : { index: false, follow: true },
};

const sections: NavItem[] = [
  { id: "reward", label: "The thank-you" },
  { id: "steps", label: "How it works" },
  { id: "refer", label: "Refer someone" },
  { id: "status", label: "Your referrals" },
  { id: "questions", label: "Questions" },
];

function Draft({ children }: { children: React.ReactNode }) {
  return <span className={styles.draftTag}>{children}</span>;
}

export default function ReferredPage() {
  const live = referral.live;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Rail items={sections} endId="__none" endLabel="Book a cleaning" homeHref="/" bookHref="/#book" />
      <MobileNav items={sections} endId="__none" homeHref="/" bookHref="/#book" bookLabel="Book a cleaning" />

      <main id="main">
        <header id="top" className={styles.hero}>
          <div className={`${styles.gutter} gutter-face`} aria-hidden="true" />
          <div className="wrap">
            <p className={styles.kicker}>Referrals</p>
            <h1 className={styles.title}>{referral.headline}</h1>
            <p className={styles.intro}>{referral.intro}</p>
            {!live && (
              <p className={styles.notice}>
                <strong>Not live yet.</strong> Anything marked <Draft>to be decided</Draft> is a placeholder.
              </p>
            )}
          </div>
        </header>

        <section id="reward" className={styles.reward} aria-labelledby="reward-title">
          <div className="wrap">
            <h2 id="reward-title" className="vh">
              The thank-you
            </h2>
            <div className={styles.rewardGrid}>
              {referral.rewards.map((r) => (
                <div key={r.who} className={styles.rewardItem}>
                  <p className={styles.rewardWho}>{r.who}</p>
                  <p className={`${styles.rewardValue} ${r.draft ? "ph" : ""}`}>{r.value}</p>
                  <p className={styles.rewardHint}>{r.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className={styles.steps} aria-labelledby="steps-title">
          <div className="wrap">
            <h2 id="steps-title">How it will work</h2>
            <ol className={styles.stepList}>
              {referral.steps.map((s, i) => (
                <li key={s.title}>
                  <Keystone n={i + 1} size={30} dashed={s.draft} />
                  <div>
                    <h3>{s.title}</h3>
                    <p className={s.draft ? styles.draftText : undefined}>{s.body}</p>
                    {s.draft && <Draft>to be decided</Draft>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="refer" className={`${styles.refer} on-dark`} aria-labelledby="refer-title">
          <div className={`wrap ${styles.referGrid}`}>
            <div>
              <h2 id="refer-title">Refer someone</h2>
              <p className={styles.referIntro}>
                Two ways this could go: you send your own link, or you give us their details and we reach out. Both are
                sketched here; keep whichever fits.
              </p>

              <div className={styles.share}>
                <p className={styles.shareLabel}>Your link</p>
                <div className={styles.shareRow}>
                  <code className={styles.shareUrl}>keystonegutterglow.com/referred?from=…</code>
                  <button type="button" className="btn btn--sky" disabled={!live}>
                    Copy
                  </button>
                </div>
                <p className={styles.shareNote}>
                  {live ? "Text it, email it, post it in the neighborhood group." : "Personal links aren't set up yet."}
                </p>
              </div>
            </div>

            <form className={styles.form} aria-describedby="refer-status">
              <fieldset disabled={!live}>
                <legend className={styles.formTitle}>Or tell us who to call</legend>
                <div className={styles.formGrid}>
                  <label>
                    Your name
                    <input name="fromName" autoComplete="name" />
                  </label>
                  <label>
                    Your phone or email
                    <input name="fromContact" />
                  </label>
                  <label>
                    Neighbor&rsquo;s name
                    <input name="toName" />
                  </label>
                  <label>
                    Neighbor&rsquo;s phone or email
                    <input name="toContact" />
                  </label>
                  <label className={styles.wide}>
                    Anything we should know? <span className={styles.optional}>(optional)</span>
                    <textarea name="note" rows={2} />
                  </label>
                </div>
                <button type="submit" className="btn btn--sky btn--wide">
                  {live ? "Send referral" : "Opens when the program starts"}
                </button>
              </fieldset>
              <p id="refer-status" className={styles.formNote}>
                {live
                  ? "We'll only use their details to offer them a cleaning."
                  : `Until then, just tell them to mention your name when they book, or have them call ${site.phone.display}.`}
              </p>
            </form>
          </div>
        </section>

        <section id="status" className={styles.status} aria-labelledby="status-title">
          <div className="wrap">
            <h2 id="status-title">Your referrals</h2>
            <p className={styles.statusIntro}>
              If the program tracks referrals, this is where you&rsquo;d see who booked and when your thank-you is on its
              way. <Draft>preview, example rows</Draft>
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Neighbor</th>
                    <th scope="col">Referred</th>
                    <th scope="col">Booked</th>
                    <th scope="col">Cleaned</th>
                    <th scope="col">Your thank-you</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Example neighbor A</td>
                    <td>Done</td>
                    <td>Done</td>
                    <td>Done</td>
                    <td>Sent</td>
                  </tr>
                  <tr>
                    <td>Example neighbor B</td>
                    <td>Done</td>
                    <td>Done</td>
                    <td>Scheduled</td>
                    <td>After their cleaning</td>
                  </tr>
                  <tr>
                    <td>Example neighbor C</td>
                    <td>Done</td>
                    <td>Not yet</td>
                    <td>–</td>
                    <td>–</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="questions" className={styles.questions} aria-labelledby="q-title">
          <div className="wrap">
            <h2 id="q-title">Questions</h2>
            <div className={styles.qList}>
              {referral.faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className={f.draft ? styles.draftText : undefined}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer onHome={false} />
    </>
  );
}
