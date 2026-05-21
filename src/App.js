import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';

// ═══════════════════════════════════════════════════════════════
// NOTE DEFINITIONS
// Each figure has: id, label, beats (in quarter-note units),
// subdivisions (how many snare hits it generates relative to 1 beat),
// and an SVG renderer key.
// ═══════════════════════════════════════════════════════════════
const FIGURES = {
  whole:        { id:'whole',        label:'Redonda',     beats:4,    svg:'whole'      },
  half:         { id:'half',         label:'Blanca',      beats:2,    svg:'half'       },
  quarter:      { id:'quarter',      label:'Negra',       beats:1,    svg:'quarter'    },
  eighth:       { id:'eighth',       label:'Corchea',     beats:0.5,  svg:'eighth'     },
  sixteenth:    { id:'sixteenth',    label:'Semicorchea', beats:0.25, svg:'sixteenth'  },
  quarter_rest: { id:'quarter_rest', label:'Silencio ♩',  beats:1,    svg:'qrest'      },
  eighth_rest:  { id:'eighth_rest',  label:'Silencio ♪',  beats:0.5,  svg:'erest'      },
};

// Figure icon groups for palette
const PALETTE_GROUPS = [
  { label:'Figuras', items:['whole','half','quarter','eighth','sixteenth'] },
  { label:'Silencios', items:['quarter_rest','eighth_rest'] },
];

// ═══════════════════════════════════════════════════════════════
// SVG NOTE RENDERERS
// ═══════════════════════════════════════════════════════════════
function NoteSVG({ type, size=64, color='#1a1a1a', highlight=false }) {
  const c = highlight ? '#000' : color;
  const w = size, h = size;
  const vb = '0 0 60 70';
  const props = { width:w, height:h, viewBox:vb, xmlns:'http://www.w3.org/2000/svg' };

  switch(type) {
    case 'whole':
      return <svg {...props}><ellipse cx="30" cy="46" rx="17" ry="10" fill="none" stroke={c} strokeWidth="3"/><ellipse cx="30" cy="46" rx="10" ry="4" fill={c} opacity="0"/></svg>;
    case 'half':
      return <svg {...props}>
        <ellipse cx="23" cy="49" rx="14" ry="9" transform="rotate(-18 23 49)" fill="none" stroke={c} strokeWidth="2.8"/>
        <line x1="36" y1="45" x2="36" y2="10" stroke={c} strokeWidth="2.8"/>
      </svg>;
    case 'quarter':
      return <svg {...props}>
        <ellipse cx="23" cy="49" rx="14" ry="9" transform="rotate(-18 23 49)" fill={c}/>
        <line x1="36" y1="45" x2="36" y2="10" stroke={c} strokeWidth="2.8"/>
      </svg>;
    case 'eighth':
      return <svg {...props}>
        <ellipse cx="21" cy="50" rx="13" ry="8" transform="rotate(-18 21 50)" fill={c}/>
        <line x1="33" y1="46" x2="33" y2="10" stroke={c} strokeWidth="2.8"/>
        <path d="M33 10 Q50 18 44 30" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      </svg>;
    case 'sixteenth':
      return <svg {...props}>
        <ellipse cx="20" cy="51" rx="13" ry="8" transform="rotate(-18 20 51)" fill={c}/>
        <line x1="32" y1="47" x2="32" y2="8" stroke={c} strokeWidth="2.8"/>
        <path d="M32 8 Q49 16 43 28" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        <path d="M32 18 Q49 26 43 38" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      </svg>;
    case 'qrest':
      return <svg {...props}>
        <path d="M26 14 Q36 14 28 24 Q38 28 25 38 L30 42 Q18 50 28 60" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
    case 'erest':
      return <svg {...props}>
        <circle cx="32" cy="30" r="5" fill={c}/>
        <line x1="35" y1="27" x2="20" y2="50" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      </svg>;
    default:
      return <svg {...props}/>;
  }
}

// ═══════════════════════════════════════════════════════════════
// STAFF LINES (5 lines, like a real staff)
// ═══════════════════════════════════════════════════════════════
function Staff() {
  return (
    <div style={{width:'88%',display:'flex',flexDirection:'column',gap:7,margin:'2px 0 4px'}}>
      {[0,1,2,3,4].map(i=>(
        <div key={i} style={{height:1.5,background:'#ccc',borderRadius:1}}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SINGLE FLASHCARD — faithful to the physical tarjetero
// ═══════════════════════════════════════════════════════════════
function RhythmCard({ figure, isActive, beatNum, totalBeats }) {
  return (
    <div className={`r-card${isActive?' r-card--active':''}`}>
      {/* Hole punch at top */}
      <div className="r-card__hole"/>
      {/* Staff */}
      <Staff/>
      {/* Note */}
      <div className="r-card__note">
        <NoteSVG type={figure.svg} size={58} color="#1a1a1a" highlight={isActive}/>
      </div>
      {/* Label */}
      <div className="r-card__label">{figure.label}</div>
      {/* Beat position indicator — X marks like the physical card */}
      <div className="r-card__beat-row">
        {Array.from({length:Math.ceil(figure.beats)}).map((_,i)=>(
          <span key={i} className="r-card__x">×</span>
        ))}
      </div>
      {/* Dot strip (like the orange dot strip on the physical cards) */}
      <div className="r-card__dot-strip">
        {Array.from({length:Math.ceil(figure.beats)}).map((_,i)=>(
          <div key={i} className={`r-card__dot${isActive?' r-card__dot--on':''}`}/>
        ))}
      </div>
      {/* Beat number badge */}
      <div className="r-card__badge">{beatNum}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RING component
// ═══════════════════════════════════════════════════════════════
function Ring() {
  return (
    <div style={{
      width:38,height:38,
      border:'5px solid var(--ring)',
      borderRadius:'50%',
      boxShadow:'inset 0 3px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
      background:'radial-gradient(circle at 35% 35%, #ffe566, #c9a000)',
      flexShrink:0,
    }}/>
  );
}

// ═══════════════════════════════════════════════════════════════
// THE BINDER — physical tarjetero look
// ═══════════════════════════════════════════════════════════════
function Binder({ cards, activeIndex }) {
  const ringCount = cards.length + 1;
  return (
    <div className="binder">
      {/* Rings row */}
      <div className="binder__rings">
        {Array.from({length:ringCount}).map((_,i)=><Ring key={i}/>)}
      </div>
      {/* Dark body */}
      <div className="binder__body">
        {/* Decorative heartbeat line */}
        <div className="binder__deco">
          <svg viewBox="0 0 200 24" width="160" height="20" style={{opacity:.5}}>
            <polyline points="0,12 30,12 40,2 50,22 60,12 80,12 90,6 100,18 110,12 200,12"
              stroke="#f5c518" strokeWidth="1.5" fill="none"/>
          </svg>
          <span style={{fontFamily:'var(--font-display)',fontStyle:'italic',color:'#f5c518',fontSize:'0.95rem',letterSpacing:2}}>Rhythm</span>
        </div>
        {/* Cards */}
        <div className="binder__cards">
          {cards.map((fig, i) => (
            <RhythmCard
              key={i}
              figure={fig}
              isActive={i === activeIndex}
              beatNum={i+1}
              totalBeats={cards.length}
            />
          ))}
        </div>
      </div>
      {/* Stand triangle shadow */}
      <div className="binder__stand"/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUDIO ENGINE
// Uses Web Audio API with precise scheduling
// - Metronome: click on every beat (accent on beat 1)
// - Snare: fires according to the figure's subdivision timing
// ═══════════════════════════════════════════════════════════════
function useAudioEngine() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }

  const resume = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }, []);

  const now = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.currentTime;
  }, []);

  // Single metronome click
  const click = useCallback((t, accent=false) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = accent ? 1400 : 900;
    g.gain.setValueAtTime(accent ? 0.5 : 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.06);
  }, []);

  // Snare (noise burst)
  const snare = useCallback((t, vol=0.6) => {
    const ctx = getCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 2000; filt.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filt); filt.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + 0.14);
  }, []);

  return { resume, now, click, snare };
}

// ═══════════════════════════════════════════════════════════════
// EXERCISE PRESETS
// "pattern" = array of figure ids that fill the measure
// length MUST equal numerator (one figure per beat slot)
// ═══════════════════════════════════════════════════════════════
const PRESETS = [
  { name:'Negras básicas',    meter:[4,4], pattern:['quarter','quarter','quarter','quarter'] },
  { name:'Negras y corcheas', meter:[4,4], pattern:['quarter','eighth','quarter','eighth'] },
  { name:'Vals simple',       meter:[3,4], pattern:['quarter','quarter','quarter'] },
  { name:'Vals con corcheas', meter:[3,4], pattern:['quarter','eighth','eighth'] },
  { name:'Con semicorcheas',  meter:[4,4], pattern:['quarter','sixteenth','quarter','eighth'] },
  { name:'Con silencios',     meter:[4,4], pattern:['quarter','quarter_rest','quarter','quarter_rest'] },
  { name:'Blancas',           meter:[4,4], pattern:['half','half'] },
  { name:'Binario simple',    meter:[2,4], pattern:['quarter','quarter'] },
  { name:'Personalizado',     meter:[4,4], pattern:[] },
];

// ═══════════════════════════════════════════════════════════════
// BUILD TIMELINE
// Given a pattern (array of figure ids) and bpm/meter,
// returns an array of scheduled events: { time, cardIndex, isSnare, isAccent }
// The timeline represents ONE full measure, then repeats.
// ═══════════════════════════════════════════════════════════════
function buildTimeline(pattern, numerator, denominator, bpm) {
  // duration of one beat (quarter note) in seconds
  const quarterDur = 60 / bpm;
  // duration of one denominator note
  const beatDur = quarterDur * (4 / denominator);

  const events = []; // { offsetSec, cardIndex, type: 'metro'|'snare', isAccent }
  let cursor = 0; // in beat units (denominator beats)

  pattern.forEach((figId, cardIdx) => {
    const fig = FIGURES[figId];
    if (!fig) return;
    const figBeats = fig.beats / (4 / denominator); // duration in denominator beats

    // Metro events: one per denominator beat covered by this figure
    for (let b = 0; b < figBeats && (cursor + b) < numerator; b++) {
      const isAccent = (cursor + b) === 0;
      events.push({
        offsetSec: (cursor + b) * beatDur,
        cardIndex: cardIdx,
        type: 'metro',
        isAccent,
        figId,
      });
    }

    // Snare events: depend on the figure
    // - whole: 1 hit at start
    // - half:  1 hit at start
    // - quarter: 1 hit at start
    // - eighth: 2 hits (start + halfway through its beat)
    // - sixteenth: 4 hits (start + every quarter of its beat)
    // - rests: no snare
    const isRest = figId.includes('rest');
    if (!isRest) {
      const figDurSec = figBeats * beatDur;
      let hitCount = 1;
      if (figId === 'eighth')     hitCount = 2;
      if (figId === 'sixteenth')  hitCount = 4;
      const interval = figDurSec / hitCount;
      for (let h = 0; h < hitCount; h++) {
        events.push({
          offsetSec: cursor * beatDur + h * interval,
          cardIndex: cardIdx,
          type: 'snare',
          isAccent: h === 0 && cursor === 0,
          figId,
        });
      }
    }

    cursor += figBeats;
  });

  // Total measure duration
  const measureDur = numerator * beatDur;
  return { events, measureDur };
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('config');
  const [tempo, setTempo] = useState(80);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [presetIdx, setPresetIdx] = useState(0);
  const [customPattern, setCustomPattern] = useState([]);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [snareOn, setSnareOn] = useState(false);

  // Play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCard, setActiveCard] = useState(-1);
  const [activeBeat, setActiveBeat] = useState(-1); // metro beat index

  const { resume, now, click, snare } = useAudioEngine();
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const timelineRef = useRef(null);
  const scheduledUpToRef = useRef(0);
  const lookahead = 0.12;

  // Derive active pattern
  const activePattern = useMemo(() => {
    if (presetIdx === PRESETS.length - 1) return customPattern;
    const p = PRESETS[presetIdx];
    return p.pattern;
  }, [presetIdx, customPattern]);

  // Recompute timeline whenever relevant params change
  const timeline = useMemo(() => {
    if (activePattern.length === 0) return null;
    return buildTimeline(activePattern, numerator, denominator, tempo);
  }, [activePattern, numerator, denominator, tempo]);

  // ── Scheduler loop ───────────────────────────────────────────
  const scheduleLoop = useCallback(() => {
    if (!timelineRef.current) return;
    const { events, measureDur } = timelineRef.current;
    const ctx_now = now();
    const scheduleUntil = ctx_now + lookahead;

    while (scheduledUpToRef.current < scheduleUntil) {
      const t = scheduledUpToRef.current;
      // Find measure offset
      const elapsed = t - startTimeRef.current;
      const measureOffset = elapsed % measureDur;

      // Find which events fall in next tiny window (we advance by smallest event gap)
      const TICK = 0.01;
      events.forEach(ev => {
        // Does this event fall within [measureOffset, measureOffset+TICK)?
        const diff = ev.offsetSec - measureOffset;
        if (diff >= 0 && diff < TICK) {
          const eventTime = t + diff;
          if (ev.type === 'metro' && metronomeOn) {
            click(eventTime, ev.isAccent);
          }
          if (ev.type === 'snare' && snareOn) {
            snare(eventTime, ev.isAccent ? 0.8 : 0.55);
          }
          // Visual update
          const delay = (eventTime - ctx_now) * 1000;
          if (ev.type === 'metro') {
            const capturedCard = ev.cardIndex;
            const capturedBeat = Math.round(ev.offsetSec / (timelineRef.current.measureDur / numerator));
            setTimeout(() => {
              setActiveCard(capturedCard);
              setActiveBeat(capturedBeat);
            }, Math.max(0, delay));
          }
        }
      });

      scheduledUpToRef.current += TICK;
    }

    rafRef.current = requestAnimationFrame(scheduleLoop);
  }, [now, click, snare, metronomeOn, snareOn, numerator]);

  useEffect(() => {
    if (isPlaying && timeline) {
      resume();
      timelineRef.current = timeline;
      startTimeRef.current = now() + 0.05;
      scheduledUpToRef.current = startTimeRef.current;
      setActiveCard(0);
      setActiveBeat(0);
      rafRef.current = requestAnimationFrame(scheduleLoop);
    } else {
      cancelAnimationFrame(rafRef.current);
      if (!isPlaying) {
        setActiveCard(-1);
        setActiveBeat(-1);
      }
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, timeline, scheduleLoop, now, resume]);

  // When playing and params change, update timeline ref on the fly
  useEffect(() => {
    if (isPlaying && timeline) {
      timelineRef.current = timeline;
    }
  }, [isPlaying, timeline]);

  // ── Sync preset meter to state ──────────────────────────────
  useEffect(() => {
    if (presetIdx < PRESETS.length - 1) {
      const [n, d] = PRESETS[presetIdx].meter;
      setNumerator(n);
      setDenominator(d);
    }
  }, [presetIdx]);

  // ── Custom pattern helpers ──────────────────────────────────
  const customBeatsUsed = customPattern.reduce((a, id) => {
    const f = FIGURES[id];
    return a + (f ? f.beats / (4/denominator) : 0);
  }, 0);
  const customBeatsRemaining = numerator - customBeatsUsed;

  const addToCustom = (figId) => {
    const f = FIGURES[figId];
    if (!f) return;
    const addedBeats = f.beats / (4/denominator);
    if (customBeatsUsed + addedBeats > numerator) return;
    setCustomPattern(prev => [...prev, figId]);
  };

  const removeLastCustom = () => setCustomPattern(prev => prev.slice(0,-1));
  const clearCustom = () => setCustomPattern([]);

  const canStart = activePattern.length > 0;

  // ── Handlers ────────────────────────────────────────────────
  const handleStart = () => {
    if (!canStart) return;
    setIsPlaying(true);
    setScreen('play');
  };

  const handleStop = () => setIsPlaying(false);
  const handleBack = () => { setIsPlaying(false); setScreen('config'); };
  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 80);
  };

  // ── Derived display ─────────────────────────────────────────
  const displayPattern = useMemo(() => {
    return activePattern.map(id => FIGURES[id] || FIGURES.quarter);
  }, [activePattern]);

  // ════════════════════════════════════════════════════════════
  // CONFIG SCREEN
  // ════════════════════════════════════════════════════════════
  if (screen === 'config') return (
    <div className="app">
      <header className="cfg-header">
        <div className="cfg-logo">
          <span className="cfg-logo__note">♩</span>
          <div>
            <div className="cfg-logo__title">Rhythm Trainer</div>
            <div className="cfg-logo__sub">Entrenador de lectura rítmica</div>
          </div>
        </div>
      </header>

      <main className="cfg-main">

        {/* TEMPO */}
        <section className="cfg-card">
          <h2 className="cfg-card__title">Tempo</h2>
          <div className="tempo-row">
            <div className="tempo-big">
              <span className="tempo-num">{tempo}</span>
              <span className="tempo-unit">BPM</span>
            </div>
            <div className="tempo-marks">
              <span>Lento</span><span>Moderato</span><span>Presto</span>
            </div>
            <input type="range" min="40" max="220" value={tempo}
              onChange={e=>setTempo(+e.target.value)}/>
            <div className="tempo-presets">
              {[60,76,92,108,120,144].map(t=>(
                <button key={t} className={`tpreset${tempo===t?' tpreset--on':''}`}
                  onClick={()=>setTempo(t)}>{t}</button>
              ))}
            </div>
          </div>
        </section>

        {/* METER */}
        <section className="cfg-card">
          <h2 className="cfg-card__title">Métrica</h2>
          <div className="meter-layout">
            <div className="meter-big">{numerator}<span className="meter-slash">/</span>{denominator}</div>
            <div className="meter-pickers">
              <div className="meter-picker-group">
                <div className="meter-picker-label">Numerador</div>
                <div className="meter-picker-row">
                  {[2,3,4,5,6,7].map(n=>(
                    <button key={n} className={`mpick${numerator===n?' mpick--on':''}`}
                      onClick={()=>{setNumerator(n);if(presetIdx!==PRESETS.length-1)setPresetIdx(PRESETS.length-1)}}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="meter-picker-group">
                <div className="meter-picker-label">Denominador</div>
                <div className="meter-picker-row">
                  {[2,4,8].map(d=>(
                    <button key={d} className={`mpick${denominator===d?' mpick--on':''}`}
                      onClick={()=>{setDenominator(d);if(presetIdx!==PRESETS.length-1)setPresetIdx(PRESETS.length-1)}}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="cfg-hint">El compás tendrá <strong>{numerator}</strong> tarjetas — una por pulso.</p>
        </section>

        {/* EXERCISE */}
        <section className="cfg-card">
          <h2 className="cfg-card__title">Ejercicio</h2>
          <div className="preset-grid">
            {PRESETS.map((p,i)=>(
              <button key={i}
                className={`preset-tile${presetIdx===i?' preset-tile--on':''}`}
                onClick={()=>setPresetIdx(i)}>
                <span className="pt-name">{p.name}</span>
                {i<PRESETS.length-1 && (
                  <span className="pt-meter">{p.meter[0]}/{p.meter[1]}</span>
                )}
                {i<PRESETS.length-1 && (
                  <div className="pt-notes">
                    {p.pattern.map((id,j)=>(
                      <NoteSVG key={j} type={FIGURES[id]?.svg||'quarter'} size={22} color="#888"/>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* CUSTOM BUILDER */}
        {presetIdx===PRESETS.length-1 && (
          <section className="cfg-card">
            <h2 className="cfg-card__title">
              Constructor &nbsp;
              <span className="cfg-hint-inline">
                {numerator - customBeatsUsed > 0
                  ? `Faltan ${+(customBeatsRemaining).toFixed(2)} pulsos`
                  : '¡Compás completo!'}
              </span>
            </h2>
            {PALETTE_GROUPS.map(grp=>(
              <div key={grp.label} className="palette-group">
                <div className="palette-group__label">{grp.label}</div>
                <div className="palette-row">
                  {grp.items.map(id=>{
                    const f = FIGURES[id];
                    const wouldAdd = f.beats/(4/denominator);
                    const disabled = wouldAdd > customBeatsRemaining + 0.001;
                    return (
                      <button key={id}
                        className={`pal-btn${disabled?' pal-btn--dis':''}`}
                        disabled={disabled}
                        onClick={()=>addToCustom(id)}>
                        <NoteSVG type={f.svg} size={38} color={disabled?'#bbb':'#1a1a1a'}/>
                        <span className="pal-label">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="custom-preview">
              {customPattern.length===0
                ? <span className="custom-empty">Añade figuras →</span>
                : customPattern.map((id,i)=>(
                    <NoteSVG key={i} type={FIGURES[id]?.svg||'quarter'} size={46} color="#1a1a1a"/>
                  ))
              }
            </div>
            <div className="custom-actions">
              <button className="cbtn cbtn--del" onClick={removeLastCustom} disabled={customPattern.length===0}>⌫ Quitar</button>
              <button className="cbtn cbtn--clr" onClick={clearCustom} disabled={customPattern.length===0}>✕ Limpiar</button>
            </div>
          </section>
        )}

        {/* SOUND OPTIONS */}
        <section className="cfg-card cfg-card--row">
          <h2 className="cfg-card__title" style={{marginBottom:0}}>Sonido</h2>
          <div className="sound-opts">
            <label className="sound-opt">
              <Toggle on={metronomeOn} onChange={setMetronomeOn}/>
              <span>🎵 Metrónomo</span>
            </label>
            <label className="sound-opt">
              <Toggle on={snareOn} onChange={setSnareOn}/>
              <span>🥁 Redoblante</span>
            </label>
          </div>
        </section>

        <button className="start-btn" onClick={handleStart} disabled={!canStart}>
          ▶ &nbsp;Iniciar práctica
        </button>

      </main>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // PLAY SCREEN
  // ════════════════════════════════════════════════════════════
  return (
    <div className="app play-app">
      {/* Top bar */}
      <header className="play-bar">
        <button className="play-back" onClick={handleBack}>← Configurar</button>
        <div className="play-bar__info">
          <span className="pbi-meter">{numerator}/{denominator}</span>
          <span className="pbi-tempo">{tempo} BPM</span>
        </div>
        <div className="play-bar__opts">
          <button className={`play-opt${metronomeOn?' play-opt--on':''}`}
            onClick={()=>setMetronomeOn(v=>!v)}>🎵</button>
          <button className={`play-opt${snareOn?' play-opt--on':''}`}
            onClick={()=>setSnareOn(v=>!v)}>🥁</button>
        </div>
      </header>

      <main className="play-main">

        {/* Beat indicator row */}
        <div className="beat-row">
          {Array.from({length:numerator}).map((_,i)=>(
            <div key={i}
              className={`beat-pip${activeBeat===i?' beat-pip--on':''} ${i===0?'beat-pip--one':''}`}>
              {i+1}
            </div>
          ))}
        </div>

        {/* THE BINDER */}
        <Binder cards={displayPattern} activeIndex={activeCard}/>

        {/* Active figure info */}
        <div className="play-figinfo">
          {activeCard >= 0 && activeCard < displayPattern.length && (
            <>
              <span className="pfi-label">Figura activa:</span>
              <span className="pfi-name">{displayPattern[activeCard]?.label}</span>
              <span className="pfi-beats">
                {displayPattern[activeCard]?.beats} {displayPattern[activeCard]?.beats===1?'tiempo':'tiempos'}
              </span>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="play-controls">
          {isPlaying
            ? <button className="ctrl-btn ctrl-btn--stop" onClick={handleStop}>⏹ Parar</button>
            : <button className="ctrl-btn ctrl-btn--play" onClick={()=>setIsPlaying(true)}>▶ Continuar</button>
          }
          <button className="ctrl-btn ctrl-btn--restart" onClick={handleRestart}>↺ Reiniciar</button>
        </div>

      </main>
    </div>
  );
}

// ── Toggle component ────────────────────────────────────────────
function Toggle({on, onChange}) {
  return (
    <div onClick={()=>onChange(v=>!v)} style={{
      width:50,height:27,borderRadius:14,
      background:on?'#1a1a1a':'#ccc',
      position:'relative',cursor:'pointer',
      transition:'background .2s',flexShrink:0,
    }}>
      <div style={{
        position:'absolute',top:3,left:on?23:3,
        width:21,height:21,borderRadius:'50%',
        background:'#fff',
        boxShadow:'0 2px 5px rgba(0,0,0,.3)',
        transition:'left .2s',
      }}/>
    </div>
  );
}
