import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';

// ═══════════════════════════════════════════════════════════════════════
// FIGURES — value (val) expressed as fraction of a WHOLE NOTE (redonda = 1)
//   Denominador table:
//     1 → redonda  (val = 1)
//     2 → blanca   (val = 1/2)
//     4 → negra    (val = 1/4)
//     8 → corchea  (val = 1/8)
//    16 → semicorchea (val = 1/16)
//
// Duration in denominator beats = fig.val * denominator
//   e.g. negra (1/4) in 4/4 → 0.25 * 4 = 1 beat
//   e.g. corchea (1/8) in 6/8 → 0.125 * 8 = 1 beat
//   e.g. semicorchea (1/16) in 6/8 → 0.0625 * 8 = 0.5 beats → 2 snare hits
// ═══════════════════════════════════════════════════════════════════════
const FIGURES = {
  whole:        { id:'whole',        label:'Redonda',     val:1,      svg:'whole'     },
  half:         { id:'half',         label:'Blanca',      val:1/2,    svg:'half'      },
  quarter:      { id:'quarter',      label:'Negra',       val:1/4,    svg:'quarter'   },
  eighth:       { id:'eighth',       label:'Corchea',     val:1/8,    svg:'eighth'    },
  sixteenth:    { id:'sixteenth',    label:'Semicorchea', val:1/16,   svg:'sixteenth' },
  half_rest:    { id:'half_rest',    label:'Silencio ♩½', val:1/2,    svg:'hrest'     },
  quarter_rest: { id:'quarter_rest', label:'Silencio ♩',  val:1/4,    svg:'qrest'     },
  eighth_rest:  { id:'eighth_rest',  label:'Silencio ♪',  val:1/8,    svg:'erest'     },
};

// Duration of ONE denominator beat as fraction of whole note
// e.g. denom=4 → 1/4; denom=8 → 1/8
function denomVal(denominator) { return 1 / denominator; }

// How many denominator beats does a figure occupy?
// = fig.val / denomVal(denom) = fig.val * denominator
function figBeats(fig, denominator) { return fig.val * denominator; }

const PALETTE_GROUPS = [
  { label:'Figuras',   items:['whole','half','quarter','eighth','sixteenth'] },
  { label:'Silencios', items:['half_rest','quarter_rest','eighth_rest'] },
];

// ═══════════════════════════════════════════════════════════════════════
// SVG NOTE RENDERERS
// ═══════════════════════════════════════════════════════════════════════
function NoteSVG({ type, size=64, color='#1a1a1a' }) {
  const c = color;
  const p = { width:size, height:size, viewBox:'0 0 60 70', xmlns:'http://www.w3.org/2000/svg' };
  switch(type) {
    case 'whole':
      return <svg {...p}><ellipse cx="30" cy="46" rx="17" ry="10" fill="none" stroke={c} strokeWidth="3"/></svg>;
    case 'half':
      return <svg {...p}>
        <ellipse cx="23" cy="49" rx="14" ry="9" transform="rotate(-18 23 49)" fill="none" stroke={c} strokeWidth="2.8"/>
        <line x1="36" y1="45" x2="36" y2="10" stroke={c} strokeWidth="2.8"/>
      </svg>;
    case 'quarter':
      return <svg {...p}>
        <ellipse cx="23" cy="49" rx="14" ry="9" transform="rotate(-18 23 49)" fill={c}/>
        <line x1="36" y1="45" x2="36" y2="10" stroke={c} strokeWidth="2.8"/>
      </svg>;
    case 'eighth':
      return <svg {...p}>
        <ellipse cx="21" cy="50" rx="13" ry="8" transform="rotate(-18 21 50)" fill={c}/>
        <line x1="33" y1="46" x2="33" y2="10" stroke={c} strokeWidth="2.8"/>
        <path d="M33 10 Q50 18 44 30" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      </svg>;
    case 'sixteenth':
      return <svg {...p}>
        <ellipse cx="20" cy="51" rx="13" ry="8" transform="rotate(-18 20 51)" fill={c}/>
        <line x1="32" y1="47" x2="32" y2="8" stroke={c} strokeWidth="2.8"/>
        <path d="M32 8 Q49 16 43 28" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        <path d="M32 18 Q49 26 43 38" stroke={c} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      </svg>;
    case 'qrest':
      return <svg {...p}>
        <path d="M26 14 Q36 14 28 24 Q38 28 25 38 L30 42 Q18 50 28 60"
          stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
    case 'hrest':
      return <svg {...p}>
        <rect x="14" y="36" width="32" height="12" fill={c} rx="1"/>
        <line x1="10" y1="34" x2="50" y2="34" stroke={c} strokeWidth="2"/>
      </svg>;
    case 'erest':
      return <svg {...p}>
        <circle cx="32" cy="30" r="5" fill={c}/>
        <line x1="35" y1="27" x2="20" y2="50" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      </svg>;
    default: return <svg {...p}/>;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// STAFF + CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════
function Staff() {
  return (
    <div style={{width:'88%',display:'flex',flexDirection:'column',gap:7,margin:'2px 0 4px'}}>
      {[0,1,2,3,4].map(i=><div key={i} style={{height:1.5,background:'#ccc',borderRadius:1}}/>)}
    </div>
  );
}

// A BEAT SLOT groups all figures that fit within one denominator beat.
// figures: array of figure objects for this beat slot
// isActive: this is the currently playing beat
// beatNum: 1-based position in measure
// isAccent: first beat of measure
function BeatCard({ figures, isActive, beatNum, isAccent }) {
  // Label: join all figure labels if multiple (sub-beat grouping)
  const hasMultiple = figures.length > 1;
  const label = hasMultiple
    ? figures.map(f => f.label).join(' + ')
    : (figures[0]?.label || '');

  // Show sub-division marks (×) below the note
  return (
    <div className={`r-card${isActive ? ' r-card--active' : ''}${isAccent ? ' r-card--accent' : ''}`}>
      <div className="r-card__hole"/>
      <Staff/>
      <div className="r-card__note">
        {hasMultiple ? (
          // Two figures side by side on same beat
          <div style={{display:'flex', gap:2, alignItems:'flex-end', justifyContent:'center'}}>
            {figures.map((f,i) => (
              <NoteSVG key={i} type={f.svg} size={hasMultiple ? 40 : 56} color="#1a1a1a"/>
            ))}
          </div>
        ) : (
          <NoteSVG type={figures[0]?.svg || 'quarter'} size={56} color="#1a1a1a"/>
        )}
      </div>
      <div className="r-card__label">{label}</div>
      {/* subdivision dots like the physical card */}
      <div className="r-card__beat-row">
        {figures.map((_,i) => <span key={i} className="r-card__x">×</span>)}
      </div>
      <div className="r-card__dot-strip">
        {figures.map((_,i) => (
          <div key={i} className={`r-card__dot${isActive ? ' r-card__dot--on' : ''}`}/>
        ))}
      </div>
      <div className={`r-card__badge${isAccent ? ' r-card__badge--accent' : ''}`}>{beatNum}</div>
    </div>
  );
}

function Ring() {
  return (
    <div style={{
      width:38, height:38,
      border:'5px solid var(--ring)',
      borderRadius:'50%',
      boxShadow:'inset 0 3px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
      background:'radial-gradient(circle at 35% 35%, #ffe566, #c9a000)',
      flexShrink:0,
    }}/>
  );
}

function Binder({ beatSlots, activeCard }) {
  const ringCount = beatSlots.length + 1;
  return (
    <div className="binder">
      <div className="binder__rings">
        {Array.from({length: ringCount}).map((_,i) => <Ring key={i}/>)}
      </div>
      <div className="binder__body">
        <div className="binder__deco">
          <svg viewBox="0 0 200 24" width="160" height="20" style={{opacity:.5}}>
            <polyline points="0,12 30,12 40,2 50,22 60,12 80,12 90,6 100,18 110,12 200,12"
              stroke="#f5c518" strokeWidth="1.5" fill="none"/>
          </svg>
          <span style={{fontFamily:'var(--font-display)',fontStyle:'italic',color:'#f5c518',fontSize:'0.95rem',letterSpacing:2}}>Rhythm</span>
        </div>
        <div className="binder__cards">
          {beatSlots.map((slot, i) => (
            <BeatCard
              key={i}
              figures={slot.figures}
              isActive={i === activeCard}
              beatNum={i + 1}
              isAccent={i === 0}
            />
          ))}
        </div>
      </div>
      <div className="binder__stand"/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// BUILD BEAT SLOTS
// Converts a flat pattern of figure IDs into BEAT SLOTS.
// Each slot = one denominator beat. Figures smaller than one beat
// are grouped into the same slot.
// Returns array of: { figures: [...], snareOffsets: [seconds from slot start] }
// ═══════════════════════════════════════════════════════════════════════
function buildBeatSlots(pattern, numerator, denominator) {
  // All durations computed relative to the whole note (redonda = 1).
  // One denominator beat = 1/denominator of a whole note.
  // figBeats(fig, denom) = fig.val * denom  → beats the figure occupies.

  const slots = Array.from({length: numerator}, () => ({
    figures: [],
    snareOffsets: [], // fractional offsets within the slot (0..1) for each snare hit
    snareCount: 0,
  }));

  let cursor = 0; // current position in denominator beats (0 .. numerator)

  for (const figId of pattern) {
    const fig = FIGURES[figId];
    if (!fig) continue;

    // How many denominator beats does this figure last?
    const durBeats = figBeats(fig, denominator); // e.g. negra in 4/4 → 1; corchea in 6/8 → 1; semicorchea in 6/8 → 0.5

    const slotIdx = Math.floor(cursor + 1e-9); // which beat slot
    if (slotIdx >= numerator) break;

    const slot = slots[slotIdx];
    slot.figures.push(fig);

    // ── Snare hits ──────────────────────────────────────────
    // The denominator IS the pulse unit. One denominator beat = 1 hit.
    // Figures that span LESS than one beat are subdivisions → multiple hits.
    // Figures spanning ONE or MORE beats → 1 hit at start only.
    //
    // hitCount = round(1 / durBeats) when durBeats < 1, else 1
    //
    // Truth table (denominator → figure → hitCount):
    //   4 → negra(1)       → 1    | 4 → corchea(0.5)   → 2   | 4 → semicorchea(0.25) → 4
    //   8 → corchea(1)     → 1    | 8 → semicorchea(0.5)→ 2  | 8 → negra(2)          → 1
    //   2 → blanca(1)      → 1    | 2 → negra(0.5)     → 2   | 2 → corchea(0.25)     → 4
    //   1 → redonda(1)     → 1    | 1 → blanca(0.5)    → 2
    const isRest = figId.includes('rest');
    if (!isRest) {
      const hitCount = durBeats < (1 - 1e-9) ? Math.round(1 / durBeats) : 1;
      const figStartInSlot = cursor - slotIdx; // position within slot as fraction of one beat
      for (let h = 0; h < hitCount; h++) {
        // Evenly distribute hits across the figure's duration within the slot
        slot.snareOffsets.push(figStartInSlot + (h / hitCount) * durBeats);
      }
      slot.snareCount += hitCount;
    }

    cursor += durBeats;
  }

  return slots;
}

// ═══════════════════════════════════════════════════════════════════════
// AUDIO ENGINE  — Web Audio API with look-ahead event scheduling
// Uses absolute time events queued ahead; perfectly seamless repeats.
// ═══════════════════════════════════════════════════════════════════════
function useAudioEngine() {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  }

  const resume = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }, []);

  const audioNow = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.currentTime;
  }, []);

  const playClick = useCallback((t, accent = false) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = accent ? 1500 : 900;
    g.gain.setValueAtTime(accent ? 0.55 : 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.07);
  }, []);

  const playSnare = useCallback((t, vol = 0.6) => {
    const ctx = getCtx();
    const len = Math.floor(ctx.sampleRate * 0.13);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 2200; filt.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    src.connect(filt); filt.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + 0.15);
  }, []);

  return { resume, audioNow, playClick, playSnare };
}

// ═══════════════════════════════════════════════════════════════════════
// PRESETS — pattern = flat list of figure ids whose durations sum to
// exactly numerator beats (in denominator units)
// ═══════════════════════════════════════════════════════════════════════
const PRESETS = [
  { name:'Negras básicas',     meter:[4,4], pattern:['quarter','quarter','quarter','quarter'] },
  { name:'Negras y corcheas',  meter:[4,4], pattern:['quarter','eighth','eighth','quarter','eighth','eighth'] },
  { name:'Vals simple',        meter:[3,4], pattern:['quarter','quarter','quarter'] },
  { name:'Vals con corcheas',  meter:[3,4], pattern:['quarter','eighth','eighth','quarter'] },
  { name:'Con semicorcheas',   meter:[4,4], pattern:['quarter','sixteenth','sixteenth','sixteenth','sixteenth','quarter','eighth','eighth'] },
  { name:'Con silencios',      meter:[4,4], pattern:['quarter','quarter_rest','quarter','quarter_rest'] },
  { name:'Blancas',            meter:[4,4], pattern:['half','half'] },
  { name:'Binario simple',     meter:[2,4], pattern:['quarter','quarter'] },
  { name:'Síncopa',            meter:[4,4], pattern:['eighth','eighth','quarter','eighth','eighth','quarter'] },
  // 6/8: denominator=8 → eighth note is ONE beat. Pattern must fill 6 eighth-note beats.
  { name:'6/8 básico',         meter:[6,8], pattern:['eighth','eighth','eighth','eighth','eighth','eighth'] },
  { name:'6/8 con semicorcheas', meter:[6,8], pattern:['eighth','eighth','eighth','sixteenth','sixteenth','eighth','eighth','eighth'] },
  { name:'Personalizado',      meter:[4,4], pattern:[] },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState('config');
  const [tempo, setTempo] = useState(80);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [presetIdx, setPresetIdx] = useState(0);
  const [customPattern, setCustomPattern] = useState([]);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [snareOn, setSnareOn] = useState(false);

  // Visual playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCard, setActiveCard] = useState(-1);
  const [activeBeat, setActiveBeat] = useState(-1); // 0-based beat within measure

  const { resume, audioNow, playClick, playSnare } = useAudioEngine();

  // Scheduler refs — never trigger re-renders
  const schedulerTimerRef = useRef(null);
  const nextBeatTimeRef = useRef(0);   // absolute audio time of next beat to schedule
  const nextBeatIdxRef = useRef(0);    // global beat counter (0, 1, 2 ... ∞)
  const slotsRef = useRef([]);
  const beatDurRef = useRef(0);
  const metroRef = useRef(true);
  const snareRef = useRef(false);
  const numRef = useRef(4);

  // Keep refs in sync with state (so scheduler closure always reads latest)
  useEffect(() => { metroRef.current = metronomeOn; }, [metronomeOn]);
  useEffect(() => { snareRef.current = snareOn; }, [snareOn]);
  useEffect(() => { numRef.current = numerator; }, [numerator]);

  // Active pattern (flat list of figure ids)
  const activePattern = useMemo(() => {
    if (presetIdx === PRESETS.length - 1) return customPattern;
    return PRESETS[presetIdx].pattern;
  }, [presetIdx, customPattern]);

  // Beat slots derived from pattern
  const beatSlots = useMemo(() => {
    if (activePattern.length === 0) return [];
    return buildBeatSlots(activePattern, numerator, denominator);
  }, [activePattern, numerator, denominator]);

  // ── Core scheduler ────────────────────────────────────────────
  // Schedules audio events AHEAD in time. Called every ~25ms.
  // Perfectly continuous: just increments absolute time per beat.
  const LOOKAHEAD = 0.15; // seconds to schedule ahead
  const INTERVAL  = 25;   // ms between scheduler calls

  const scheduleBeat = useCallback((beatAbsTime, beatIdxInMeasure) => {
    const slots = slotsRef.current;
    const beatDur = beatDurRef.current;
    if (!slots.length || !beatDur) return;

    const slot = slots[beatIdxInMeasure];
    if (!slot) return;

    const isAccent = beatIdxInMeasure === 0;

    // Metronome click on every beat
    if (metroRef.current) {
      playClick(beatAbsTime, isAccent);
    }

    // Snare hits according to sub-beat offsets
    if (snareRef.current && slot.snareOffsets.length > 0) {
      for (const frac of slot.snareOffsets) {
        const hitTime = beatAbsTime + frac * beatDur;
        playSnare(hitTime, isAccent && frac === 0 ? 0.8 : 0.55);
      }
    }

    // Schedule visual update via setTimeout aligned to audio time
    const now = audioNow();
    const delayMs = Math.max(0, (beatAbsTime - now) * 1000);
    const capturedIdx = beatIdxInMeasure;
    setTimeout(() => {
      setActiveCard(capturedIdx);
      setActiveBeat(capturedIdx);
    }, delayMs);
  }, [playClick, playSnare, audioNow]);

  const runScheduler = useCallback(() => {
    const now = audioNow();
    const scheduleUntil = now + LOOKAHEAD;

    while (nextBeatTimeRef.current < scheduleUntil) {
      const n = numRef.current;
      const beatInMeasure = nextBeatIdxRef.current % n;
      scheduleBeat(nextBeatTimeRef.current, beatInMeasure);
      nextBeatTimeRef.current += beatDurRef.current;
      nextBeatIdxRef.current += 1;
    }
  }, [audioNow, scheduleBeat]);

  // ── Start / stop ──────────────────────────────────────────────
  const startPlayback = useCallback((slots, bpm, denom) => {
    resume();
    // Duration of one denominator beat in seconds:
    // one beat = (1/denom) whole note = (4/denom) quarter notes = (4/denom) * (60/bpm) seconds
    const quarterDur = 60 / bpm;
    const bd = quarterDur * (4 / denom);
    slotsRef.current = slots;
    beatDurRef.current = bd;
    nextBeatIdxRef.current = 0;
    nextBeatTimeRef.current = audioNow() + 0.05; // tiny start delay for audio context
    setActiveCard(0);
    setActiveBeat(0);
    // Kick off scheduler
    if (schedulerTimerRef.current) clearInterval(schedulerTimerRef.current);
    schedulerTimerRef.current = setInterval(runScheduler, INTERVAL);
    // Run once immediately so first beats are scheduled right away
    runScheduler();
  }, [resume, audioNow, runScheduler]);

  const stopPlayback = useCallback(() => {
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    setActiveCard(-1);
    setActiveBeat(-1);
  }, []);

  // Effect: start/stop when isPlaying changes
  useEffect(() => {
    if (isPlaying && beatSlots.length > 0) {
      startPlayback(beatSlots, tempo, denominator);
    } else if (!isPlaying) {
      stopPlayback();
    }
    return () => stopPlayback();
    
  }, [isPlaying]);

  // If tempo/meter/pattern changes while playing, restart seamlessly
  const prevPlayingRef = useRef(false);
  useEffect(() => {
    if (isPlaying && prevPlayingRef.current) {
      stopPlayback();
      startPlayback(beatSlots, tempo, denominator);
    }
    prevPlayingRef.current = isPlaying;
  
  }, [tempo, denominator, numerator, beatSlots]);

  // Sync preset meter to numerator/denominator state
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
    return a + (f ? figBeats(f, denominator) : 0);
  }, 0);
  const customBeatsRemaining = numerator - customBeatsUsed;

  const addToCustom = (figId) => {
    const f = FIGURES[figId];
    if (!f) return;
    const addedBeats = figBeats(f, denominator);
    if (customBeatsUsed + addedBeats > numerator + 0.001) return;
    setCustomPattern(prev => [...prev, figId]);
  };
  const removeLastCustom = () => setCustomPattern(prev => prev.slice(0, -1));
  const clearCustom = () => setCustomPattern([]);

  const canStart = beatSlots.length > 0;

  const handleStart = () => { if (!canStart) return; setIsPlaying(true); setScreen('play'); };
  const handleStop = () => setIsPlaying(false);
  const handleBack = () => { setIsPlaying(false); setScreen('config'); };
  const handleRestart = () => {
    stopPlayback();
    setTimeout(() => {
      setIsPlaying(true);
      startPlayback(beatSlots, tempo, denominator);
    }, 60);
  };

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
            <div className="tempo-marks"><span>Lento</span><span>Moderato</span><span>Presto</span></div>
            <input type="range" min="40" max="220" value={tempo} onChange={e=>setTempo(+e.target.value)}/>
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
                      onClick={()=>{setNumerator(n);setPresetIdx(PRESETS.length-1)}}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="meter-picker-group">
                <div className="meter-picker-label">Denominador</div>
                <div className="meter-picker-row">
                  {[2,4,8].map(d=>(
                    <button key={d} className={`mpick${denominator===d?' mpick--on':''}`}
                      onClick={()=>{setDenominator(d);setPresetIdx(PRESETS.length-1)}}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="cfg-hint">El compás tendrá <strong>{numerator}</strong> tarjetas — una por pulso del denominador.</p>
        </section>

        {/* EXERCISES */}
        <section className="cfg-card">
          <h2 className="cfg-card__title">Ejercicio</h2>
          <div className="preset-grid">
            {PRESETS.map((p,i)=>(
              <button key={i}
                className={`preset-tile${presetIdx===i?' preset-tile--on':''}`}
                onClick={()=>setPresetIdx(i)}>
                <span className="pt-name">{p.name}</span>
                {i<PRESETS.length-1 && <span className="pt-meter">{p.meter[0]}/{p.meter[1]}</span>}
                {i<PRESETS.length-1 && (
                  <div className="pt-notes">
                    {p.pattern.slice(0,5).map((id,j)=>(
                      <NoteSVG key={j} type={FIGURES[id]?.svg||'quarter'} size={20} color="#999"/>
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
                {customBeatsRemaining > 0.001
                  ? `Faltan ${parseFloat(customBeatsRemaining.toFixed(3))} pulsos`
                  : '¡Compás completo!'}
              </span>
            </h2>
            {PALETTE_GROUPS.map(grp=>(
              <div key={grp.label} className="palette-group">
                <div className="palette-group__label">{grp.label}</div>
                <div className="palette-row">
                  {grp.items.map(id=>{
                    const f = FIGURES[id];
                    const w = figBeats(f, denominator);
                    const disabled = w > customBeatsRemaining + 0.001;
                    return (
                      <button key={id}
                        className={`pal-btn${disabled?' pal-btn--dis':''}`}
                        disabled={disabled}
                        onClick={()=>addToCustom(id)}>
                        <NoteSVG type={f.svg} size={36} color={disabled?'#bbb':'#1a1a1a'}/>
                        <span className="pal-label">{f.label}</span>
                        <span className="pal-beats">{w < 1 ? `1/${Math.round(1/w)}` : w} pulso{w!==1?'s':''}</span>
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
                    <NoteSVG key={i} type={FIGURES[id]?.svg||'quarter'} size={44} color="#1a1a1a"/>
                  ))
              }
            </div>
            <div className="custom-actions">
              <button className="cbtn cbtn--del" onClick={removeLastCustom} disabled={!customPattern.length}>⌫ Quitar</button>
              <button className="cbtn cbtn--clr" onClick={clearCustom} disabled={!customPattern.length}>✕ Limpiar</button>
            </div>
          </section>
        )}

        {/* SOUND */}
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
      <header className="play-bar">
        <button className="play-back" onClick={handleBack}>← Configurar</button>
        <div className="play-bar__info">
          <span className="pbi-meter">{numerator}/{denominator}</span>
          <span className="pbi-tempo">{tempo} BPM</span>
        </div>
        <div className="play-bar__opts">
          <button className={`play-opt${metronomeOn?' play-opt--on':''}`}
            onClick={()=>setMetronomeOn(v=>!v)} title="Metrónomo">🎵</button>
          <button className={`play-opt${snareOn?' play-opt--on':''}`}
            onClick={()=>setSnareOn(v=>!v)} title="Redoblante">🥁</button>
        </div>
      </header>

      <main className="play-main">
        {/* Beat pips */}
        <div className="beat-row">
          {Array.from({length:numerator}).map((_,i)=>(
            <div key={i}
              className={`beat-pip${activeBeat===i?' beat-pip--on':''} ${i===0?'beat-pip--one':''}`}>
              {i+1}
            </div>
          ))}
        </div>

        {/* THE BINDER */}
        <Binder beatSlots={beatSlots} activeCard={activeCard}/>

        {/* Active slot info */}
        <div className="play-figinfo">
          {activeCard >= 0 && activeCard < beatSlots.length && (() => {
            const slot = beatSlots[activeCard];
            const label = slot.figures.map(f=>f.label).join(' + ');
            return <>
              <span className="pfi-label">Pulso {activeCard+1}:</span>
              <span className="pfi-name">{label}</span>
              {slot.snareCount > 1 && (
                <span className="pfi-beats">{slot.snareCount} subdivisiones</span>
              )}
            </>;
          })()}
        </div>

        {/* Controls */}
        <div className="play-controls">
          {isPlaying
            ? <button className="ctrl-btn ctrl-btn--stop" onClick={handleStop}>⏹ Parar</button>
            : <button className="ctrl-btn ctrl-btn--play" onClick={()=>{ setIsPlaying(true); startPlayback(beatSlots, tempo, denominator); }}>▶ Continuar</button>
          }
          <button className="ctrl-btn ctrl-btn--restart" onClick={handleRestart}>↺ Reiniciar</button>
        </div>
      </main>
    </div>
  );
}

function Toggle({on, onChange}) {
  return (
    <div onClick={()=>onChange(v=>!v)} style={{
      width:50,height:27,borderRadius:14,
      background:on?'#1a1a1a':'#ccc',
      position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0,
    }}>
      <div style={{
        position:'absolute',top:3,left:on?23:3,
        width:21,height:21,borderRadius:'50%',
        background:'#fff',boxShadow:'0 2px 5px rgba(0,0,0,.3)',transition:'left .2s',
      }}/>
    </div>
  );
}
