import { useEffect, useRef, useState } from "react";
import { challenges } from "./challenges";
import ReadingChallenge from "./ReadingChallenge";
import StepsArchive from "./StepsArchive";
import "./lhs365.css";


function currentRoute() {
  return window.location.hash.slice(1) || "/";
}

function Home() {
  return (
    <section className="challenge-history compact-collection">
      <h1>Our challenges</h1>
      <div className="challenge-grid">
        {challenges.map((challenge) => (
          <a className="collection-card" href={challenge.href} key={challenge.id}>
            <div className="collection-content">
              <span className="eyebrow">{challenge.status === "closed" ? "Completed" : "This term · Preview"}</span>
              <h2>{challenge.title}</h2>
              <span className="text-link">{challenge.status === "closed" ? "View journey →" : "Log reading →"}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function Lhs365() {
  const [route, setRoute] = useState(currentRoute);
  const main = useRef(null);
  useEffect(() => {
    const navigate = () => {
      if (window.location.hash.startsWith("#/")) {
        setRoute(currentRoute());
        window.scrollTo(0, 0);
        main.current?.focus();
      }
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    document.title = `${route === "/reading" || route === "/" ? "Read for Snehalaya" : route === "/steps" ? "Steps to Snehalaya" : "Learning beyond school"} | 25Thirty 365 · Leicester High School`;
  }, [route]);
  return (
    <div className="lhs365">
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
        <a className="brand" href="#/" aria-label="25Thirty 365 home">
          <span className="suite-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>
            25Thirty <b>365</b>
            <small>PART OF 25THIRTY SCHOOL</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#/challenges" aria-current={route === "/challenges" ? "page" : undefined}>
            Challenges
          </a>
          <a
            href="#/reading"
            aria-current={route === "/reading" || route === "/" ? "page" : undefined}
          >
            Log reading
          </a>
        </nav>
        <span className="school-context"><img src="/lhs-logo.png" alt="" /><span>Leicester High School<small>LHS 365 · A little every day.</small></span></span>
      </header>
      <main id="main-content" ref={main} tabIndex={-1}>
        {route === "/steps" ? <StepsArchive /> : route === "/challenges" ? <Home /> : <ReadingChallenge />}
      </main>
      <footer className="site-footer">
        <a className="footer-brand" href="#/">
          25Thirty <b>365</b>
        </a>
        <p>Leicester High School · LHS 365</p>
        <a className="suite-link" href="https://25thirty.school">Part of 25Thirty School ↗</a>
      </footer>
    </div>
  );
}
