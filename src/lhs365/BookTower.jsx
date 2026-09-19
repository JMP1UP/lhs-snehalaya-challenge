import { useState } from "react";
import { landmarks, nextLandmark, towerProgress, formatHeight, visibleBookStack } from "./tower.mjs";

function LandmarkIllustration({type}) {
  if(type==="bus")return <svg className="landmark-illustration bus" viewBox="0 0 190 150" aria-hidden="true"><g stroke="#071b45" strokeWidth="6" strokeLinejoin="round"><path fill="#e83d52" d="M12 25h142c18 0 25 10 25 27v70H12z"/><path fill="#fff8e8" d="M27 39h42v29H27zm54 0h42v29H81zm54 0h29v29h-29zM27 80h42v25H27zm54 0h42v25H81zm54 0h29v25h-29z"/><circle fill="#ffd447" cx="48" cy="124" r="15"/><circle fill="#ffd447" cx="145" cy="124" r="15"/></g></svg>;
  if(type==="tree")return <svg className="landmark-illustration tree" viewBox="0 0 180 250" aria-hidden="true"><g stroke="#071b45" strokeWidth="6" strokeLinejoin="round"><path fill="#e83d52" d="M74 238 84 119h27l8 119z"/><path fill="#38c6e8" d="M91 9c25 0 38 18 36 38 24-4 42 14 37 37 21 10 23 40 4 53-3 28-34 39-54 23-15 22-52 19-62-5-26 6-47-18-36-41-18-18-5-50 20-50-2-24 23-40 43-30 1-14 5-25 12-25z"/></g></svg>;
  if(type==="eiffel")return <svg className="landmark-illustration eiffel" viewBox="0 0 150 260" aria-hidden="true"><g fill="none" stroke="#071b45" strokeWidth="6" strokeLinejoin="round"><path fill="#ffd447" d="m75 6-13 87-47 153h120L88 93z"/><path d="M40 164h70M28 207h94M55 112h40M46 246c0-48 58-48 58 0M75 6v86"/></g></svg>;
  if(type==="giraffe")return <svg className="landmark-illustration giraffe" viewBox="0 0 150 240" aria-hidden="true">
    <g stroke="#071b45" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
      <path fill="#ffd447" d="M28 128c0-25 18-42 48-42h25l8-53c2-14 12-24 25-23l5 1-8 69c-2 19-9 34-22 46l-7 6H55c-16 0-27 10-27 24z"/>
      <path fill="#ffd447" d="M111 21c3-12 13-18 25-15l10 3-5 25-28-5z"/>
      <path fill="#ffd447" d="M120 8V2m16 8 4-6M113 18l-12-6m37 11 10-3"/>
      <circle cx="136" cy="17" r="2.5" fill="#071b45" stroke="none"/>
      <path fill="#ffd447" d="M39 128v101h16l5-97m32 0 3 97h16l4-108"/>
      <path fill="none" d="M30 105 12 93l-6 13"/>
    </g>
    <g fill="#e83d52"><path d="m66 96 12-6 9 10-10 10z"/><path d="m95 101 10-5 6 11-12 7z"/><path d="m44 111 11-7 8 10-9 11z"/><path d="m113 46 13-5 5 11-15 7z"/><path d="m110 67 12-4 4 11-14 6z"/></g>
  </svg>;
  if(type==="big-ben")return <svg className="landmark-illustration big-ben" viewBox="0 0 110 250" aria-hidden="true">
    <g stroke="#071b45" strokeWidth="6" strokeLinejoin="round"><path fill="#ffd447" d="m55 4 24 35H31z"/><path fill="#fff8e8" d="M30 39h50v198H30z"/><path fill="#38c6e8" d="M37 104h36v120H37z"/><path fill="#e83d52" d="M27 87h56v19H27z"/><circle cx="55" cy="67" r="20" fill="#fff8e8"/><path fill="none" strokeLinecap="round" d="M55 67V54m0 13 10 7"/><path fill="#ffd447" d="M22 224h66v18H22z"/></g>
  </svg>;
  return <svg className="landmark-illustration door" viewBox="0 0 120 230" aria-hidden="true">
    <g stroke="#071b45" strokeWidth="7" strokeLinejoin="round"><path fill="#ffd447" d="m24 218 9-203h78l-9 203z"/><path fill="#fffdf7" d="M14 218V28h78v190z"/><path fill="none" d="M30 49h46v69H30zm0 86h46v61H30z"/><circle cx="76" cy="127" r="5" fill="#e83d52"/></g>
  </svg>;
}

export default function BookTower({ pages, books = [], preview = true }) {
  const [selected, setSelected] = useState(()=>nextLandmark(pages).id);
  const landmark = landmarks.find((item) => item.id === selected);
  const tower = towerProgress(pages, landmark);
  // Every logged title belongs in the visual bookshelf, even when an older
  // record has no eligible page contribution. Height still comes from `pages`.
  const stack = visibleBookStack(books);
  return (
    <section className="tower-mission" aria-labelledby="tower-title">
      <div className="tower-copy">
        <span className="eyebrow">The book tower · {preview ? "Your preview" : "Your contribution"}</span>
        <h2 id="tower-title">Your tower is <em>{formatHeight(tower.millimetres)} high.</em></h2>
        <p className="tower-comparison">{tower.remaining ? `Climbing towards ${landmark.name}.` : `Higher than ${landmark.name}.`}</p>
        <div className="tower-targets" role="group" aria-label="Explore tower targets">
          {landmarks.map((item) => <button key={item.id} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>{item.label} <span>{item.metres} m</span></button>)}
        </div>
      <div className={`tower-art ${selected}`} aria-hidden="true">
        <span className="tower-flag">{landmark.metres} m ↑</span>
        <LandmarkIllustration type={selected}/>
        <div className="paper-stack">
          {stack.map((book) => <i key={book.id}><span>{book.title}</span></i>)}
          {pages === 0 && <span className="tower-start"><i /><i /><i /></span>}
        </div>
        <div className="tower-ground" />
        <small className="tower-art-caption">Not to scale</small>
      </div>
        {books.length > stack.length && <p className="tower-stack-count"><strong>{books.length.toLocaleString()} books logged</strong> · showing the latest {stack.length}</p>}
        <p className="tower-total">{pages > 0 ? <strong>{formatHeight(tower.millimetres)}</strong> : <span className="tower-welcome">Your first page starts the tower.</span>}</p>
        <progress value={tower.percent} max="100" aria-label={`Tower progress towards ${landmark.name}`} />
        <p className="tower-remaining">{pages === 0 ? "20 pages = 1 mm" : tower.remaining ? `${pages.toLocaleString()} pages` : "Height reached"}</p>
        <details className="tower-rules">
          <summary>How it works</summary>
          <p>20 pages = 1 mm. {tower.remaining.toLocaleString()} pages to reach {landmark.metres} m. This is an estimate; the illustration is not to scale.</p>
          <p>Changing the landmark only changes the comparison. References: representative <a href="https://giraffeconservation.org/wp-content/uploads/2016/03/Giraffe-Africas-giants.pdf">5 m giraffe</a> and <a href="https://www.parliament.uk/about/living-heritage/building/palace/big-ben/facts-figures/">96 m Elizabeth Tower</a>.</p>
        </details>
      </div>

    </section>
  );
}
