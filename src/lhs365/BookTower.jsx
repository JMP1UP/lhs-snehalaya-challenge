import { useState } from "react";
import { landmarks, towerProgress, formatHeight } from "./tower.mjs";

export default function BookTower({ pages }) {
  const [selected, setSelected] = useState("door");
  const landmark = landmarks.find((item) => item.id === selected);
  const tower = towerProgress(pages, landmark);
  return (
    <section className="tower-mission" aria-labelledby="tower-title">
      <div className="tower-copy">
        <span className="eyebrow">The book tower · Your preview</span>
        <h2 id="tower-title">As tall as <em>{landmark.name}.</em></h2>
        <div className="tower-targets" role="group" aria-label="Explore tower targets">
          {landmarks.map((item) => <button key={item.id} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>{item.label} <span>{item.metres} m</span></button>)}
        </div>
        <p className="tower-total"><strong>{formatHeight(tower.millimetres)}</strong> added by your reading</p>
        <progress value={tower.percent} max="100" aria-label={`Tower progress towards ${landmark.name}`} />
        <p className="tower-remaining">{tower.remaining ? `${tower.remaining.toLocaleString()} pages to reach ${landmark.metres} m` : "Height reached! Try the next landmark."}</p>
        <details className="tower-rules">
          <summary>How does it work?</summary>
          <p>We estimate 1,000 pages = 5 cm of stacked paper. Every new page counts, including unfinished books. This is a challenge estimate, not a measurement of your book.</p>
          <p>This preview shows only your entries. A shared school tower and final term target are still to come. Choosing a landmark explores the goal; it does not change your saved pages.</p>
          <p>Doorway: illustrative 2 m. Giraffe: representative <a href="https://giraffeconservation.org/wp-content/uploads/2016/03/Giraffe-Africas-giants.pdf">5 m adult</a>. Big Ben: <a href="https://www.parliament.uk/about/living-heritage/building/palace/big-ben/facts-figures/">96 m Elizabeth Tower</a>. Illustration is decorative; the progress bar gives the proportion.</p>
        </details>
      </div>
      <div className="tower-art" aria-hidden="true">
        <span className="tower-flag">{landmark.metres} m ↑</span>
        <div className={`landmark-silhouette ${selected}`}><span /></div>
        <div className="paper-stack">
          {Array.from({ length: Math.min(9, Math.ceil(pages / 100)) }, (_, index) => <i key={index}  />)}
          {pages === 0 && <span className="tower-start">Your first page<br />starts it.</span>}
        </div>
        <div className="tower-ground" />
        <small className="tower-art-caption">Not to scale</small>
      </div>
    </section>
  );
}
