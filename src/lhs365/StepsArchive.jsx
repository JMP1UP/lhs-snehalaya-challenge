// Aggregate results transcribed from the original App.jsx Hall of Fame.
// Static history: never initialise Firebase or load individual participant records.
export default function StepsArchive() {
  return (
    <div className="steps-celebration">
      <a className="text-link" href="#/challenges">← All our adventures</a>
      <section className="finish-party" aria-labelledby="finish-title">
        <div className="finish-confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--n": i }} />)}</div>
        <span className="finish-badge">✦ MISSION ACCOMPLISHED ✦</span>
        <h1 id="finish-title">We made it.<br /><span>And then some.</span></h1>
        <p className="finish-distance"><strong>8,535.1</strong> <span>km together</span></p>
        <div className="finish-stamp" aria-label="122 percent of our target">122%<small>OF OUR TARGET</small></div>
        <div className="finish-route" role="img" aria-label="Illustrated challenge journey from Leicester to the 7,000 kilometre Snehalaya goal, then 1,535.1 kilometres beyond it. Not a geographical map.">
          <svg viewBox="0 0 900 190" aria-hidden="true">
            <path className="route-shadow" d="M65 132 C190 132 140 45 290 65 S420 164 550 105 S700 62 800 67" />
            <path className="route-line" d="M65 132 C190 132 140 45 290 65 S420 164 550 105 S700 62 800 67" />
            <circle cx="65" cy="132" r="10" fill="#1cffe3" />
            <circle cx="550" cy="105" r="15" fill="#ff2bd6" stroke="white" strokeWidth="4" />
            <circle cx="800" cy="67" r="11" fill="#1cffe3" />
            <path d="M550 89V23L591 34L550 48" fill="#ff2bd6" stroke="#ff2bd6" strokeWidth="5" strokeLinejoin="round" />
            <text x="65" y="164" textAnchor="middle">LEICESTER</text>
            <text x="550" y="144" textAnchor="middle">SNEHALAYA ✓</text>
            <text x="800" y="105" textAnchor="middle">AND BEYOND!</text>
            <text className="route-small" x="550" y="165" textAnchor="middle">7,000 km goal</text>
          </svg>
        </div>
      </section>
      <section className="finish-facts" aria-label="The challenge in numbers">
        <div><span aria-hidden="true">👟</span><strong>125</strong><p>students &amp; staff</p></div>
        <div><span aria-hidden="true">⚡</span><strong>849</strong><p>activities logged</p></div>
        <div><span aria-hidden="true">↗</span><strong>1,535.1 <small>km</small></strong><p>beyond our goal</p></div>
      </section>
      <div className="finish-next"><h2>Our next adventure</h2><a className="challenge-cta" href="#/reading">Start reading <span aria-hidden="true">➜</span></a></div>
      <details className="finish-source"><summary>About these results</summary><p>Final aggregate figures from the original Steps to Snehalaya Hall of Fame: 8,535.1 km against a 7,000 km target, 125 contributors and 849 activities. Percentage rounded to the nearest whole number. This is a static celebration of the completed challenge; individual records stay in the original app.</p></details>
    </div>
  );
}
