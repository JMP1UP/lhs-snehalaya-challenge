import { useEffect, useRef, useState } from "react";
import { challenges } from "./challenges";
import ReadingChallenge from "./ReadingChallenge";
import StepsArchive from "./StepsArchive";
import "./lhs365.css";


function currentRoute() {
  return window.location.hash.slice(1) || "/";
}

function BookIllustration() {
  return (
    <div className="book-illustration" aria-hidden="true">
      <div className="orbit-word">A little reading. A wider world.</div>
      <div className="book-star star-one">✳</div>
      <div className="book-star star-two">✧</div>
      <div className="illustrated-book book-back">
        <span>WONDER</span>
      </div>
      <div className="illustrated-book book-front">
        <div className="cover-border">
          <small>THE LHS 365 COLLECTION</small>
          <span className="cover-title">
            One more
            <br />
            <i>chapter.</i>
          </span>
          <div className="cover-flower">✳</div>
          <span className="cover-bottom">
            READ FOR SNEHALAYA
            <br />
            AUTUMN 2026
          </span>
        </div>
      </div>
      <div className="book-base">
        <span>Stories take us further</span>
        <b>365</b>
      </div>
      <span className="illustration-caption">
        Your next adventure is a page away.
      </span>
    </div>
  );
}

function Home() {
  const featured = challenges.find((challenge) => challenge.featured);
  const past = challenges.filter((challenge) => challenge.status === "closed");
  return (
    <>
      <section className="home-intro">
        <div className="eyebrow">
          <span className="tiny-star">✳</span> Leicester High School · Beyond
          the school day
        </div>
        <h1>
          Curiosity doesn’t
          <br />
          end at <em>the school gates.</em>
        </h1>
        <p>
          Make time for discovery, movement and making a difference.
          <br className="desktop-break" /> Small everyday experiences. A whole
          year of possibilities.
        </p>
      </section>
      <section className="featured-challenge" aria-labelledby="featured-title">
        <div className="feature-copy">
          <div className="feature-label">
            <span className="status-pill">Next chapter · Preview</span>
            <span>{featured.term}</span>
          </div>
          <span className="eyebrow">The latest LHS 365 challenge</span>
          <h2 id="featured-title">
            Read for
            <br />
            <em>Snehalaya.</em>
          </h2>
          <p>{featured.description}</p>
          <a className="button cream" href={featured.href}>
            Explore the reading challenge <span aria-hidden="true">↗</span>
          </a>
          <div className="feature-footnote">
            <span>01 / Reading & discovery</span>
            <span>Every page is a beginning.</span>
          </div>
        </div>
        <BookIllustration />
      </section>
      <section className="principles" aria-label="The LHS 365 approach">
        <div>
          <span>01</span>
          <p>
            <strong>Find your thing.</strong> Follow what makes you curious.
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            <strong>Make a little time.</strong> Build a habit, at your own
            pace.
          </p>
        </div>
        <div>
          <span>03</span>
          <p>
            <strong>Be part of something.</strong> Grow together, beyond school.
          </p>
        </div>
      </section>
      <section id="challenges" className="challenge-history">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Our story so far</span>
            <h2>Small actions. Shared adventures.</h2>
          </div>
          <span className="archive-count">
            The challenge collection /{" "}
            {String(challenges.length).padStart(2, "0")}
          </span>
        </div>
        <div className="challenge-grid">
          <a
            href={featured.href}
            className="collection-card reading-collection"
          >
            <div className="collection-art reading-art" aria-hidden="true">
              <span className="shelf-book spine-one">DISCOVER</span>
              <span className="shelf-book spine-two">One more chapter</span>
              <span className="shelf-book spine-three">READ</span>
              <span className="shelf-book spine-four">A wider world</span>
            </div>
            <div className="collection-content">
              <div className="card-meta">
                <span>{featured.category}</span>
                <span>Preview</span>
              </div>
              <h3>
                {featured.title}
                <span aria-hidden="true">↗</span>
              </h3>
              <p>A bookshelf of possibilities. Our next shared adventure.</p>
              <span className="text-link">Explore the challenge →</span>
            </div>
          </a>
          {past.map((challenge) => (
            <a
              href={challenge.href}
              className="collection-card steps-collection"
              key={challenge.id}
            >
              <div className="collection-art steps-art" aria-hidden="true">
                <svg viewBox="0 0 500 180" fill="none">
                  <path
                    d="M-20 155C70 145 15 20 135 65S225 185 290 89 420 50 535 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="6 8"
                  />
                  <circle cx="135" cy="65" r="8" fill="currentColor" />
                  <circle cx="290" cy="89" r="8" fill="currentColor" />
                </svg>
                <span>
                  Leicester <i>to</i> Snehalaya
                </span>
                <small>A journey we made together.</small>
              </div>
              <div className="collection-content">
                <div className="card-meta">
                  <span>{challenge.category}</span>
                  <span>Closed</span>
                </div>
                <h3>
                  {challenge.title}
                  <span aria-hidden="true">↗</span>
                </h3>
                <p>{challenge.description}</p>
                <span className="text-link">Revisit the steps challenge →</span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section id="about" className="about-365">
        <span className="about-mark" aria-hidden="true">
          365<span>days of possibility</span>
        </span>
        <div>
          <span className="eyebrow">Learning for life</span>
          <h2>
            There’s more to growing
            <br />
            than what happens in class.
          </h2>
          <p>
            LHS 365 brings together challenges that help us explore, build
            confidence and contribute to our communities. At home, at school,
            and everywhere in between.
          </p>
          <p>Join in your own way. Bring your curiosity.</p>
        </div>
      </section>
    </>
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
    document.title = `${route === "/reading" ? "Read for Snehalaya" : route === "/steps" ? "Steps to Snehalaya" : "Learning beyond school"} | 25Thirty 365 · Leicester High School`;
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
          <a href="#/" aria-current={route === "/" ? "page" : undefined}>
            Discover
          </a>
          <a
            href="#/reading"
            aria-current={route === "/reading" ? "page" : undefined}
          >
            Reading challenge
          </a>
        </nav>
        <span className="school-context"><img src="/lhs-logo.png" alt="" /><span>Leicester High School<small>LHS 365 · A little every day.</small></span></span>
      </header>
      <main id="main-content" ref={main} tabIndex={-1}>
        {route === "/reading" ? <ReadingChallenge /> : route === "/steps" ? <StepsArchive /> : <Home />}
      </main>
      <footer className="site-footer">
        <a className="footer-brand" href="#/">
          25Thirty <b>365</b>
        </a>
        <p>A world of learning. A lifetime of possibility.</p>
        <a className="suite-link" href="https://25thirty.school">Part of 25Thirty School ↗</a>
      </footer>
    </div>
  );
}
