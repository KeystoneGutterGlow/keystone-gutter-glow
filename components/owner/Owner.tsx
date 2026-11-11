import Image from "next/image";
import { BookLink } from "@/components/BookLink";
import { LaurelSprig } from "@/components/botanical/Botanical";
import { PhotoSlot } from "@/components/PhotoSlot";
import { owner } from "@/content/owner";
import { site } from "@/content/site";
import styles from "./Owner.module.css";

// Jimmy's own story and quote. Anything still marked as a draft renders hatched so nobody
// mistakes it for finished copy; see content/owner.ts.

export function Owner() {
  return (
    <section id="jimmy" className={styles.owner} aria-labelledby="jimmy-title">
      <LaurelSprig className={styles.laurel} />
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.photoCol}>
          <div className={styles.block} aria-hidden="true" />
          {owner.photo.src ? (
            <Image
              src={owner.photo.src}
              alt={owner.photo.alt}
              width={owner.photo.width}
              height={owner.photo.height}
              sizes="(max-width: 899px) 90vw, 440px"
              className={styles.photo}
            />
          ) : (
            <PhotoSlot label="Photo of Jimmy" want={owner.photo.want} ratio="4 / 5" />
          )}
        </div>

        <div className={styles.text}>
          <p className={styles.kicker}>The owner</p>
          <h2 id="jimmy-title" className={styles.name}>
            {owner.name}
          </h2>

          <blockquote className={styles.quote}>
            <p>
              <span className={owner.quote.draft ? "ph" : undefined}>{owner.quote.text}</span>
            </p>
          </blockquote>

          <div className={styles.story}>
            {owner.story.map((para, i) => (
              <p key={i} className={para.draft ? styles.draft : undefined}>
                {para.draft && <span className={styles.draftTag}>Story to come</span>}
                {para.text}
              </p>
            ))}
          </div>

          <dl className={styles.facts}>
            <div>
              <dt>Calls and texts</dt>
              <dd>
                <a href={site.phone.href}>{site.phone.display}</a>
              </dd>
            </div>
            <div>
              <dt>Email, straight to Jimmy</dt>
              <dd>
                {/* Break after the @ when it doesn't fit, not inside the domain */}
                <a href={`mailto:${site.email}`}>
                  {site.email.split("@")[0]}@<wbr />
                  {site.email.split("@")[1]}
                </a>
              </dd>
            </div>
          </dl>

          <BookLink className="btn">
            Get on Jimmy&rsquo;s schedule
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </BookLink>
        </div>
      </div>
    </section>
  );
}
