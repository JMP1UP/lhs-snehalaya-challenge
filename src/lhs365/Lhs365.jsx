import { useEffect, useRef, useState } from "react";
import ReadingChallenge from "./ReadingChallenge";
import StepsArchive from "./StepsArchive";
import "./lhs365.css";
import "./challenge-brand.css";


function currentRoute() {
  return window.location.hash.slice(1) || "/";
}

function Home() {
  return (
    <div className="challenge-home">
      <section className="adventure-intro">
        <span className="adventure-tag">LEICESTER HIGH · LHS 365</span>
        <h1>Small actions.<br /><span>BIG adventures.</span></h1>
        <p>Our next challenge starts with a page.</p>
        <span className="home-spark spark-left" aria-hidden="true">✳</span>
        <span className="home-spark spark-right" aria-hidden="true">✦</span>
      </section>
      <section className="reading-feature" aria-labelledby="reading-feature-title">
        <div className="reading-feature-copy">
          <span className="challenge-badge">📚 THIS TERM · READING PREVIEW</span>
          <h2 id="reading-feature-title">Read. Stack.<br /><em>Reach higher.</em></h2>
          <p>Can our book tower grow as tall as a giraffe?</p>
          <a className="challenge-cta" href="#/reading">Log your reading <span aria-hidden="true">➜</span></a>
          <small>Fictional entries only for now.</small>
        </div>
        <div className="home-book-art" aria-hidden="true">
          <span className="book-art-sticker">HOW HIGH<br />CAN WE GO?</span>
          <span className="art-twinkle">✦</span>
          <div className="hero-book hb-one">ONE MORE CHAPTER <span>✦</span></div>
          <div className="hero-book hb-two">A WORLD OF STORIES</div>
          <div className="hero-book hb-three">READ · STACK · REPEAT</div>
          <div className="hero-book hb-four">THE LHS BOOK TOWER <span>↗</span></div>
          <div className="book-art-ground" />
        </div>
      </section>
      <section className="past-adventure" aria-labelledby="past-adventure-title">
        <div className="past-route" aria-hidden="true"><span>👟</span><i /> <span>📍</span></div>
        <div><span className="adventure-tag">OUR FIRST ADVENTURE · WE DID IT!</span><h2 id="past-adventure-title">Steps to Snehalaya</h2><p>8,535.1 km together. 122% of our goal.</p></div>
        <a href="#/steps">Celebrate the journey <span aria-hidden="true">➜</span></a>
      </section>
    </div>
  );
}

export default function Lhs365() {
  const [route, setRoute] = useState(currentRoute);
  const main = useRef(null);
  useEffect(() => {
    const navigate = () => {
      if (!window.location.hash || window.location.hash.startsWith("#/")) {
        setRoute(currentRoute());
        window.scrollTo(0, 0);
        main.current?.focus();
      }
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    document.title = `${route === "/reading" ? "Read for Snehalaya" : route === "/steps" ? "Steps to Snehalaya" : "Learning beyond school"} | 25Thirty 365 · Leicester High School`;
  }, [route]);
  return (
    <div className={`lhs365 ${route === "/reading" ? "reading-theme" : "adventure-theme"}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
          main.current?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="LHS 365 home">
          <span className="school-logo-tile"><img src="/lhs-logo.png" alt="Leicester High School" /></span>
          <span>LHS <b>365</b><small>PART OF 25THIRTY SCHOOL</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#/" aria-current={route === "/" || route === "/challenges" ? "page" : undefined}>
            Challenges <span className="nav-challenge-count" aria-label="2 challenges">2</span>
          </a>
          <a
            href="#/reading"
            aria-current={route === "/reading" ? "page" : undefined}
          >
            Log reading
          </a>
        </nav>
        <span className="school-context">A little every day. <span aria-hidden="true">✦</span></span>
      </header>
      <main id="main-content" ref={main} tabIndex={-1}>
        {route === "/steps" ? <StepsArchive /> : route === "/reading" ? <ReadingChallenge /> : <Home />}
      </main>
      <footer className="site-footer">
        <p>Leicester High School · LHS 365</p>
        <a className="suite-link" href="https://25thirty.school">Part of 25Thirty School ↗</a>
      </footer>
    </div>
  );
}
