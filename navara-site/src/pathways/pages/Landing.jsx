import React from 'react';
import { Nav, Footer, usePathwaysEffects, Arcs } from '../components/Chrome';

const LINKS = (<>
  <a href="/pathways/rbt">RBT Prep</a><a href="/pathways/bcba">BCBA Prep</a><a href="/pathways/sample-quiz">Sample Quizzes</a><a href="/pathways/plans">Plans</a>
  <a className="btn btn-ghost btn-sm" href="/pathways/login">Log in</a>
</>);

export default function Landing() {
  usePathwaysEffects();
  return (<>
    <Nav links={LINKS} />
    <main>

<header className="hero">
  <div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div>
  <svg className="hero-arcs" viewBox="100 115 1170 245" aria-hidden="true"><path fill="#B1C9B3" d="M395 165 L482 151 L565 145 L639 145 L740 153 L817 165 L909 186 L1004 215 L1104 252 L1075 236 L1009 206 L915 172 L815 147 L737 135 L635 129 L556 132 L506 138 L456 147 Z"/><path fill="#5F8D9C" d="M139 345 L206 305 L252 281 L304 258 L367 235 L439 215 L490 205 L557 196 L616 192 L692 192 L744 195 L826 205 L923 224 L1008 247 L1076 270 L1148 299 L1224 336 L1160 297 L1086 262 L1018 236 L945 213 L866 194 L788 181 L697 173 L617 173 L537 180 L476 190 L425 202 L361 222 L303 245 L245 274 L191 306 Z"/><path fill="#1E324A" d="M276 347 L344 315 L387 298 L449 278 L502 264 L556 253 L618 244 L692 238 L776 238 L880 247 L985 266 L1102 299 L1232 348 L1170 316 L1116 293 L1065 274 L1000 254 L952 242 L888 230 L843 224 L775 219 L703 219 L634 224 L572 233 L504 248 L459 261 L397 283 L328 315 Z"/></svg>
  <div className="wrap hero-grid">
    <div>
      <span className="eyebrow rv in">Navara Pathways</span>
      <h1 data-rise>Pass the exam. <span className="grad">Own the science.</span></h1>
      <p className="lead">Exam preparation for future Registered Behavior Technicians and Board Certified Behavior Analysts. Practice questions that teach, mock exams that feel like the real thing, and one-on-one time with a Navara Certified Behavior Specialist (NCBS).</p>
      <div className="hero-ctas">
        <a className="btn btn-primary" href="/pathways/rbt">Explore RBT prep</a>
        <a className="btn btn-ghost" href="/pathways/bcba">Explore BCBA prep</a>
      </div>
      <div className="hero-badge"><span className="dot"></span> Free sample quizzes, no account needed</div>
    </div>
  </div>
</header>

<div className="section dark" style={{paddingTop:0}}>
  <div className="marquee"><div className="marquee-track">
    <span>Practice that teaches</span><span>Real explanations</span><span>Timed mock exams</span><span>One-on-one NCBS™ time</span><span>Progress by topic</span>
    <span>Practice that teaches</span><span>Real explanations</span><span>Timed mock exams</span><span>One-on-one NCBS™ time</span><span>Progress by topic</span>
  </div></div>
  <div className="wrap" style={{paddingTop:'80px'}}>
    <div className="stats">
      <div className="stat rv"><div className="num" data-count="1000" data-suffix="">1,000</div><div className="lbl">Original practice questions across both banks</div></div>
      <div className="stat rv rv-d1"><div className="num" data-count="2">2</div><div className="lbl">Exam tracks, RBT and BCBA</div></div>
      <div className="stat rv rv-d2"><div className="num" data-count="15">15</div><div className="lbl">Content outline areas covered</div></div>
      <div className="stat rv rv-d3"><div className="num" data-count="1" data-suffix=":1">1:1</div><div className="lbl">Time with an NCBS™</div></div>
    </div>
  </div>
</div>

<section className="section">
  <div className="wrap">
    <div className="section-head rv"><span className="eyebrow" style={{color:'var(--teal-3)'}}>Choose your track</span>
      <h2>Two exams. One standard of preparation.</h2>
      <p>Same engine, same structure, different science. Each track has its own question bank, its own mock exams, and copy written for where you are in the field.</p>
    </div>
    <div className="tracks">
      <a className="track-card rv" href="/pathways/rbt">
        <div className="glow" style={{background:'#5F8D9C'}}></div>
        <span className="track-tag tag-teal">RBT track</span>
        <h3>Preparation for the RBT certification exam</h3>
        <p>For behavior technicians getting certified. Foundations, measurement, skill acquisition, behavior reduction, documentation, and professional conduct.</p>
        <ul className="track-feats">
          <li><span className="ck">&#10003;</span>Practice sets by task-list area</li>
          <li><span className="ck">&#10003;</span>Timed mock exams under real conditions</li>
          <li><span className="ck">&#10003;</span>An explanation for every answer</li>
        </ul>
        <span className="card-link">See the RBT track <span className="arr">&rarr;</span></span>
      </a>
      <a className="track-card rv rv-d1" href="/pathways/bcba">
        <div className="glow" style={{background:'#87aa99'}}></div>
        <span className="track-tag tag-navy">BCBA track</span>
        <h3>Preparation for the BCBA certification exam</h3>
        <p>For analysts sitting for the board exam. Concepts and principles, experimental design, assessment, intervention, supervision, and ethics.</p>
        <ul className="track-feats">
          <li><span className="ck">&#10003;</span>Scenario-based practice by content area</li>
          <li><span className="ck">&#10003;</span>Full-length timed mock exams</li>
          <li><span className="ck">&#10003;</span>1:1 sessions with an NCBS™</li>
        </ul>
        <span className="card-link">See the BCBA track <span className="arr">&rarr;</span></span>
      </a>
    </div>
  </div>
</section>

<section className="section" style={{background:'#fff'}}>
  <div className="wrap">
    <div className="section-head center rv"><span className="eyebrow" style={{color:'var(--teal-3)'}}>How it works</span>
      <h2>Study that moves with you.</h2>
    </div>
    <div className="steps">
      <div className="step rv"><div className="ic">&#9673;</div><h4>Try a free sample quiz</h4><p>Ten questions, no account. Feel how the explanations teach, not just grade.</p></div>
      <div className="step rv"><div className="ic">&#9673;</div><h4>Build your study plan</h4><p>Tell us your track and exam date - get a week-by-week checklist, free. <a href="/pathways/study-plan" style={{ color: 'var(--teal-3)', fontWeight: 700 }}>Build my plan</a></p></div>
      <div className="step rv rv-d1"><div className="ic">&#9656;</div><h4>Pick your plan</h4><p>Self-Study unlocks the full bank and mock exams. Guided adds one-on-one sessions with an NCBS™.</p></div>
      <div className="step rv rv-d2"><div className="ic">&#10004;</div><h4>Watch yourself improve</h4><p>Progress tracking by topic shows exactly where to spend your next hour.</p></div>
    </div>
  </div>
</section>

<section className="section">
  <div className="wrap">
    <div className="cta-band rv">
      <div className="orb-4"></div>
      <h2>Start with ten free questions.</h2>
      <p>Sample quizzes for both tracks, no account and no card. If the explanations make you smarter in five minutes, imagine the full bank.</p>
      <a className="btn btn-primary" href="/pathways/sample-quiz">Take a sample quiz</a>
    </div>
  </div>
</section>

</main>
    <Footer />
  </>);
}
