import { useEffect, useRef, useState } from "react";
import ReadingAccess from "./ReadingAccess";
import AdminDashboard from "./AdminDashboard";
import { liveReading } from "./reading-client.mjs";
import StepsArchive from "./StepsArchive";
import OpenDayMission from "./OpenDayMission";
import "./lhs365.css";
import "./challenge-brand.css";


function currentRoute() {
  return (window.location.hash.slice(1).split("?")[0] || "/");
}

function Home() {
  const aboutDialog = useRef(null);

  return (
    <div className="challenge-home">
      <section className="adventure-intro">
        <span className="adventure-tag">LEICESTER HIGH · LHS 365 · TOGETHER FOR SNEHALAYA</span>
        <h1>Small actions.<br />One <span>remarkable</span> community.</h1>
        <p>Whole-school challenges for learning, wellbeing and service.</p>
        <button className="about-365-trigger" type="button" onClick={() => aboutDialog.current?.showModal()}>
          What is LHS 365?
        </button>
        <span className="home-spark spark-left" aria-hidden="true">✳</span>
        <span className="home-spark spark-right" aria-hidden="true">✦</span>
      </section>
      <dialog className="about-365-dialog" ref={aboutDialog} aria-labelledby="about-365-title">
        <form method="dialog">
          <button className="dialog-close" value="close" aria-label="Close">×</button>
          <span className="adventure-tag">BEYOND THE CLASSROOM</span>
          <h2 id="about-365-title">What is LHS 365?</h2>
          <p>Education does not stop at the school gates. LHS 365 helps students notice and embrace opportunities to read, move, create, serve and explore.</p>
          <p>Our challenges are inclusive, purposeful and shared. When each person contributes a little, the whole community can achieve more than any of us could alone.</p>
          <p>Every adventure also keeps our friendship with Snehalaya visible—connecting everyday action at Leicester High with a wider sense of community and possibility.</p>
          <button className="dialog-done" value="close">Got it</button>
        </form>
      </dialog>
      <section className="reading-feature reading-feature--teaser" aria-labelledby="reading-feature-title">
        <div className="reading-feature-copy">
          <span className="challenge-badge">AUTUMN 2026 · NEARLY HERE</span>
          <h2 id="reading-feature-title">A new chapter<br /><em>is about to begin.</em></h2>
          <p>Our next whole-school challenge is almost ready.</p>
          <span className="challenge-cta challenge-cta--soon">Autumn Challenge - Coming Soon!</span>
        </div>
        <div className="home-book-art" role="img" aria-label="A playful stack of books hints at the next Autumn Challenge.">
          <span className="book-art-sticker">COMING<br />SOON</span>
          <span className="art-twinkle">✦</span>
          <span className="tower-now-label">WHAT COULD IT BE?</span>
          <div className="home-live-stack" aria-hidden="true">
            <i>TURN THE PAGE</i>
            <i>A NEW ADVENTURE</i>
            <i>A STORY IS TAKING SHAPE</i>
          </div>
          <div className="book-art-ground" />
        </div>
      </section>
      <section className="past-adventure" aria-labelledby="past-adventure-title">
        <div className="past-success-copy">
          <span className="adventure-tag">OUR FIRST ADVENTURE · MISSION ACCOMPLISHED</span>
          <h2 id="past-adventure-title">We made it to Snehalaya—and kept going.</h2>
          <a href="#/steps">See the journey <span aria-hidden="true">➜</span></a>
        </div>
        <dl className="past-success-stats" aria-label="Steps to Snehalaya final results">
          <div className="past-success-total"><dt>Together we reached</dt><dd>8,535.1 <small>km</small></dd></div>
          <div><dt>Of our 7,000 km goal</dt><dd>122%</dd></div>
          <div><dt>Beyond the finish line</dt><dd>1,535.1 <small>km</small></dd></div>
          <div><dt>Community effort</dt><dd>125 <small>people · 849 activities</small></dd></div>
        </dl>
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
    document.title = `${route === "/admin" ? "Reading admin" : route === "/teacher" ? "Teacher reading dashboard" : route === "/open-day" ? "My Open Day mission" : route === "/reading" ? "Read for Snehalaya" : route === "/steps" ? "Steps to Snehalaya" : "Learning beyond school"} | 25Thirty 365 · Leicester High School`;
  }, [route]);
  return (
    <div className={`lhs365 ${route === "/reading" || route === "/admin" ? "reading-theme" : "adventure-theme"}`}>
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
          <a href="#/open-day" aria-current={route === "/open-day" ? "page" : undefined}>Open Day</a>
        </nav>
        <span className="school-context">A little every day. <span aria-hidden="true">✦</span></span>
      </header>
      <main id="main-content" ref={main} tabIndex={-1}>
        {route === "/steps" ? <StepsArchive /> : route === "/admin" ? <AdminDashboard /> : route === "/teacher" ? <AdminDashboard view="teacher" /> : route === "/open-day" ? <OpenDayMission /> : route === "/reading" ? <ReadingAccess /> : <Home />}
      </main>
      <footer className="site-footer">
        <p>Leicester High School · LHS 365</p>
        <a href="#/admin">{liveReading ? "Reading admin" : "Admin preview"}</a>
        <a className="suite-link" href="https://25thirty.school">Part of 25Thirty School ↗</a>
      </footer>
    </div>
  );
}
