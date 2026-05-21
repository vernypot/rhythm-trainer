import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ─── Note definitions ───────────────────────────────────────────────────────
const NOTE_TYPES = {
  WHOLE:        { id: 'whole',        label: 'Redonda',       beats: 4, svg: 'whole' },
  HALF:         { id: 'half',         label: 'Blanca',        beats: 2, svg: 'half' },
  QUARTER:      { id: 'quarter',      label: 'Negra',         beats: 1, svg: 'quarter' },
  EIGHTH:       { id: 'eighth',       label: 'Corchea',       beats: 0.5, svg: 'eighth' },
  SIXTEENTH:    { id: 'sixteenth',    label: 'Semicorchea',   beats: 0.25, svg: 'sixteenth' },
  QUARTER_REST: { id: 'quarter_rest', label: 'Silencio',      beats: 1, svg: 'rest' },
  EIGHTH_REST:  { id: 'eighth_rest',  label: 'Silencio 1/8',  beats: 0.5, svg: 'eighth_rest' },
};

// ─── SVG note renderers ──────────────────────────────────────────────────────
const NoteSVG = ({ type, size = 60, active = false, color = '#111' }) => {
  const c = active ? '#000' : color;
  const stroke = active ? '#000' : color;

  switch(type) {
    case 'whole':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <ellipse cx="30" cy="38" rx="16" ry="10" fill="none" stroke={c} strokeWidth="3"/>
        </svg>
      );
    case 'half':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <ellipse cx="22" cy="42" rx="13" ry="8" transform="rotate(-15 22 42)" fill="none" stroke={c} strokeWidth="2.5"/>
          <line x1="34" y1="38" x2="34" y2="10" stroke={c} strokeWidth="2.5"/>
        </svg>
      );
    case 'quarter':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <ellipse cx="22" cy="42" rx="13" ry="8" transform="rotate(-15 22 42)" fill={c}/>
          <line x1="34" y1="38" x2="34" y2="10" stroke={c} strokeWidth="2.5"/>
        </svg>
      );
    case 'eighth':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <ellipse cx="22" cy="42" rx="12" ry="7" transform="rotate(-15 22 42)" fill={c}/>
          <line x1="33" y1="38" x2="33" y2="10" stroke={c} strokeWidth="2.5"/>
          <path d="M33 10 Q48 16 42 26" stroke={c} strokeWidth="2.5" fill="none"/>
        </svg>
      );
    case 'sixteenth':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <ellipse cx="20" cy="44" rx="12" ry="7" transform="rotate(-15 20 44)" fill={c}/>
          <line x1="31" y1="40" x2="31" y2="8" stroke={c} strokeWidth="2.5"/>
          <path d="M31 8 Q46 14 40 24" stroke={c} strokeWidth="2.5" fill="none"/>
          <path d="M31 16 Q46 22 40 32" stroke={c} strokeWidth="2.5" fill="none"/>
        </svg>
      );
    case 'rest':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <rect x="20" y="28" width="20" height="10" fill={c}/>
          <line x1="15" y1="25" x2="45" y2="25" stroke={c} strokeWidth="2"/>
          <line x1="20" y1="38" x2="40" y2="38" stroke={c} strokeWidth="2"/>
        </svg>
      );
    case 'eighth_rest':
      return (
        <svg width={size} height={size} viewBox="0 0 60 60">
          <text x="18" y="46" fontSize="32" fill={c} fontFamily="serif">𝄾</text>
        </svg>
      );
    default:
      return null;
  }
};

// ─── Beat indicator dots ─────────────────────────────────────────────────────
const BeatDots = ({ total, active }) => (
  <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:6 }}>
    {Array.from({length: total}).map((_, i) => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: '50%',
        background: i < active ? '#f5c518' : '#ccc',
        transition: 'background 0.1s',
      }}/>
    ))}
  </div>
);

// ─── Single flashcard ────────────────────────────────────────────────────────
const RhythmCard = ({ note, isActive, beatProgress, index, total }) => {
  const beatsInMeasure = Math.ceil(note.beats);
  const activeDots = isActive ? Math.ceil(beatProgress * beatsInMeasure) : 0;

  return (
    <div className={`rhythm-card ${isActive ? 'card-active' : ''}`}
         style={{ animationDelay: `${index * 0.05}s` }}>
      {/* Ring hole */}
      <div className="card-hole"/>
      {/* Staff lines */}
      <div className="staff-lines">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="staff-line"/>
        ))}
      </div>
      {/* Note */}
      <div className="note-symbol">
        <NoteSVG type={note.svg} size={56} active={isActive}/>
      </div>
      {/* Note label */}
      <div className="note-label">{note.label}</div>
      {/* Beat dots */}
      <BeatDots total={Math.ceil(note.beats)} active={activeDots}/>
      {/* Beat count badge */}
      <div className="beat-badge">{note.beats < 1 ? `1/${1/note.beats}` : note.beats}</div>
    </div>
  );
};

// ─── Binder / Tarjetero ──────────────────────────────────────────────────────
const Binder = ({ cards, currentCard, beatProgress }) => {
  const ringCount = Math.min(cards.length + 1, 6);
  return (
    <div className="binder-wrapper">
      {/* Rings */}
      <div className="rings-row">
        {Array.from({length: ringCount}).map((_, i) => (
          <div key={i} className="ring"/>
        ))}
      </div>
      {/* Binder body */}
      <div className="binder-body">
        {cards.map((note, i) => (
          <RhythmCard
            key={i}
            note={note}
            isActive={i === currentCard}
            beatProgress={beatProgress}
            index={i}
            total={cards.length}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Beat flash indicator ────────────────────────────────────────────────────
const BeatFlash = ({ beat, numerator, isPlaying }) => (
  <div className="beat-display">
    {Array.from({length: numerator}).map((_, i) => (
      <div key={i} className={`beat-dot-large ${isPlaying && i === (beat % numerator) ? 'beat-lit' : ''} ${i === 0 ? 'beat-one' : ''}`}>
        {i + 1}
      </div>
    ))}
  </div>
);

// ─── Waveform decoration ─────────────────────────────────────────────────────
const Waveform = ({ active }) => (
  <div className="waveform">
    {Array.from({length: 20}).map((_, i) => (
      <div key={i} className={`wave-bar ${active ? 'wave-active' : ''}`}
           style={{ animationDelay: `${i * 0.08}s` }}/>
    ))}
  </div>
);

// ─── Exercise presets ────────────────────────────────────────────────────────
const EXERCISES = [
  {
    name: 'Negras básicas',
    description: 'Solo negras — ideal para comenzar',
    numerator: 4,
    notes: ['quarter','quarter','quarter','quarter'],
  },
  {
    name: 'Negras y corcheas',
    description: 'Mezcla de tiempos simples',
    numerator: 4,
    notes: ['quarter','eighth','eighth','quarter','quarter'],
  },
  {
    name: 'Vals simple',
    description: 'Ritmo ternario 3/4',
    numerator: 3,
    notes: ['quarter','quarter','quarter'],
  },
  {
    name: 'Síncopa básica',
    description: 'Corchea-negra-corchea',
    numerator: 4,
    notes: ['eighth','quarter','eighth','eighth','quarter','eighth'],
  },
  {
    name: 'Semicorcheas',
    description: 'Subdivisión rápida',
    numerator: 4,
    notes: ['sixteenth','sixteenth','sixteenth','sixteenth','quarter','quarter'],
  },
  {
    name: 'Con silencios',
    description: 'Practica los silencios',
    numerator: 4,
    notes: ['quarter','quarter_rest','quarter','quarter_rest'],
  },
  {
    name: 'Blancas y negras',
    description: 'Valores largos',
    numerator: 4,
    notes: ['half','quarter','quarter'],
  },
  {
    name: 'Personalizado',
    description: 'Arma tu propio compás',
    numerator: 4,
    notes: [],
  },
];

// ─── Audio engine ────────────────────────────────────────────────────────────
function useAudioEngine() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playClick = useCallback((time, isAccent = false) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isAccent ? 1200 : 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(isAccent ? 0.4 : 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.08);
  }, []);

  const playSnare = useCallback((time) => {
    const ctx = getCtx();
    // Noise burst
    const bufSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(time);
    source.stop(time + 0.15);
  }, []);

  const currentTime = () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.currentTime;
  };

  const resume = () => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  };

  return { playClick, playSnare, currentTime, resume };
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('config'); // 'config' | 'play'
  const [tempo, setTempo] = useState(80);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [customNotes, setCustomNotes] = useState([]);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [snareOn, setSnareOn] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [beatProgress, setBeatProgress] = useState(0);

  const { playClick, playSnare, currentTime, resume } = useAudioEngine();
  const schedulerRef = useRef(null);
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const cardIndexRef = useRef(0);
  const cardBeatRef = useRef(0);

  const getActiveNotes = () => {
    if (selectedExercise === 7) return customNotes.map(id => NOTE_TYPES[id.toUpperCase()] || NOTE_TYPES.QUARTER);
    return EXERCISES[selectedExercise].notes.map(id => NOTE_TYPES[id.toUpperCase()] || NOTE_TYPES.QUARTER);
  };

  const activeNotes = getActiveNotes();
  const beatDuration = 60 / tempo; // seconds per beat (quarter note)

  // Scheduler
  const schedule = useCallback(() => {
    const now = currentTime();
    const lookahead = 0.1;

    while (nextBeatTimeRef.current < now + lookahead) {
      const beatTime = nextBeatTimeRef.current;
      const bi = beatIndexRef.current % numerator;
      const isAccent = bi === 0;

      if (metronomeOn) playClick(beatTime, isAccent);

      // Update visual state
      const capturedBeat = beatIndexRef.current;
      const capturedCard = cardIndexRef.current;
      const delay = (beatTime - now) * 1000;
      setTimeout(() => {
        setCurrentBeat(capturedBeat % numerator);
        setCurrentCard(capturedCard);
        setBeatProgress(0);
      }, Math.max(0, delay));

      // Snare: play on each note start
      const notes = getActiveNotes();
      if (notes.length > 0) {
        const note = notes[cardIndexRef.current % notes.length];
        if (snareOn && cardBeatRef.current === 0) {
          playSnare(beatTime);
        }
      }

      // Advance card
      if (activeNotes.length > 0) {
        const note = activeNotes[cardIndexRef.current % activeNotes.length];
        const beatsPerNote = note.beats / (4 / denominator);
        cardBeatRef.current += 1;
        if (cardBeatRef.current >= beatsPerNote) {
          cardBeatRef.current = 0;
          cardIndexRef.current = (cardIndexRef.current + 1) % activeNotes.length;
        }
      }

      beatIndexRef.current += 1;
      nextBeatTimeRef.current += beatDuration;
    }
  }, [tempo, numerator, denominator, metronomeOn, snareOn, activeNotes.length]);

  useEffect(() => {
    if (isPlaying) {
      resume();
      nextBeatTimeRef.current = currentTime() + 0.05;
      beatIndexRef.current = 0;
      cardIndexRef.current = 0;
      cardBeatRef.current = 0;
      schedulerRef.current = setInterval(schedule, 25);
    } else {
      clearInterval(schedulerRef.current);
    }
    return () => clearInterval(schedulerRef.current);
  }, [isPlaying, schedule]);

  // Beat progress animation
  useEffect(() => {
    if (!isPlaying) { setBeatProgress(0); return; }
    const interval = setInterval(() => {
      setBeatProgress(p => {
        const inc = (25 / (beatDuration * 1000));
        return Math.min(p + inc, 1);
      });
    }, 25);
    return () => clearInterval(interval);
  }, [isPlaying, currentCard, beatDuration]);

  const handleStart = () => {
    if (activeNotes.length === 0) return;
    setCurrentCard(0);
    setCurrentBeat(0);
    setBeatProgress(0);
    setIsPlaying(true);
    setScreen('play');
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentCard(0);
    setCurrentBeat(0);
  };

  const handleBack = () => {
    setIsPlaying(false);
    setScreen('config');
  };

  const toggleNote = (noteId) => {
    setCustomNotes(prev => {
      const total = prev.reduce((acc, id) => {
        const n = NOTE_TYPES[id.toUpperCase()];
        return acc + (n ? n.beats : 1);
      }, 0);
      const n = NOTE_TYPES[noteId.toUpperCase()];
      if (!n) return prev;
      const wouldTotal = total + n.beats;
      if (wouldTotal > numerator * 2) return prev; // soft limit
      return [...prev, noteId];
    });
  };

  const removeLastNote = () => setCustomNotes(prev => prev.slice(0, -1));

  const exerciseNumerator = selectedExercise === 7 ? numerator : EXERCISES[selectedExercise].numerator;

  // ── Config screen ────────────────────────────────────────────────────────
  if (screen === 'config') {
    return (
      <div className="app">
        <header className="app-header">
          <div className="logo-area">
            <span className="logo-icon">♩</span>
            <h1 className="logo-text">RHYTHM<span className="logo-accent">TRAINER</span></h1>
          </div>
          <Waveform active={false}/>
        </header>

        <main className="config-screen">
          {/* Tempo */}
          <section className="config-section">
            <h2 className="section-title">TEMPO</h2>
            <div className="tempo-display">
              <span className="tempo-number">{tempo}</span>
              <span className="tempo-unit">BPM</span>
            </div>
            <input type="range" min="40" max="220" value={tempo}
              onChange={e => setTempo(Number(e.target.value))}
              className="tempo-slider"/>
            <div className="tempo-presets">
              {[60,80,100,120,140,160].map(t => (
                <button key={t} className={`preset-btn ${tempo === t ? 'active' : ''}`}
                  onClick={() => setTempo(t)}>{t}</button>
              ))}
            </div>
          </section>

          {/* Meter */}
          <section className="config-section">
            <h2 className="section-title">MÉTRICA</h2>
            <div className="meter-row">
              <div className="meter-group">
                <label>Numerador</label>
                <div className="meter-buttons">
                  {[2,3,4,5,6,7].map(n => (
                    <button key={n}
                      className={`meter-btn ${numerator === n ? 'active' : ''}`}
                      onClick={() => setNumerator(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="meter-divider">/</div>
              <div className="meter-group">
                <label>Denominador</label>
                <div className="meter-buttons">
                  {[2,4,8].map(d => (
                    <button key={d}
                      className={`meter-btn ${denominator === d ? 'active' : ''}`}
                      onClick={() => setDenominator(d)}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="meter-preview">{numerator}/{denominator}</div>
          </section>

          {/* Exercise selector */}
          <section className="config-section">
            <h2 className="section-title">EJERCICIO</h2>
            <div className="exercise-grid">
              {EXERCISES.map((ex, i) => (
                <button key={i}
                  className={`exercise-card ${selectedExercise === i ? 'active' : ''}`}
                  onClick={() => setSelectedExercise(i)}>
                  <span className="ex-name">{ex.name}</span>
                  <span className="ex-desc">{ex.description}</span>
                  {i !== 7 && (
                    <div className="ex-preview">
                      {ex.notes.slice(0,4).map((n, j) => (
                        <NoteSVG key={j} type={NOTE_TYPES[n.toUpperCase()]?.svg || 'quarter'} size={24} color="#888"/>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Custom note builder */}
          {selectedExercise === 7 && (
            <section className="config-section">
              <h2 className="section-title">CONSTRUYE TU COMPÁS</h2>
              <div className="note-palette">
                {Object.values(NOTE_TYPES).map(note => (
                  <button key={note.id} className="note-palette-btn"
                    onClick={() => toggleNote(note.id)}>
                    <NoteSVG type={note.svg} size={40} color="#f5c518"/>
                    <span>{note.label}</span>
                  </button>
                ))}
              </div>
              <div className="custom-preview">
                {customNotes.length === 0
                  ? <span className="empty-hint">↑ Añade figuras arriba</span>
                  : customNotes.map((id, i) => {
                      const n = NOTE_TYPES[id.toUpperCase()];
                      return n ? <NoteSVG key={i} type={n.svg} size={44} color="#f0f0f0"/> : null;
                    })
                }
              </div>
              {customNotes.length > 0 && (
                <button className="remove-btn" onClick={removeLastNote}>⌫ Quitar última</button>
              )}
            </section>
          )}

          {/* Options */}
          <section className="config-section">
            <h2 className="section-title">OPCIONES DE SONIDO</h2>
            <div className="options-row">
              <label className="toggle-label">
                <div className={`toggle ${metronomeOn ? 'on' : ''}`}
                  onClick={() => setMetronomeOn(v => !v)}>
                  <div className="toggle-knob"/>
                </div>
                <span>🎵 Metrónomo</span>
              </label>
              <label className="toggle-label">
                <div className={`toggle ${snareOn ? 'on' : ''}`}
                  onClick={() => setSnareOn(v => !v)}>
                  <div className="toggle-knob"/>
                </div>
                <span>🥁 Redoblante</span>
              </label>
            </div>
          </section>

          {/* Start button */}
          <button className="start-btn"
            disabled={activeNotes.length === 0}
            onClick={handleStart}>
            ▶ INICIAR PRÁCTICA
          </button>
        </main>
      </div>
    );
  }

  // ── Play screen ──────────────────────────────────────────────────────────
  return (
    <div className="app play-screen-bg">
      <header className="play-header">
        <button className="back-btn" onClick={handleBack}>← Volver</button>
        <div className="play-info">
          <span className="play-meter">{exerciseNumerator}/{denominator}</span>
          <span className="play-tempo">{tempo} <small>BPM</small></span>
        </div>
        <Waveform active={isPlaying}/>
      </header>

      <main className="play-main">
        {/* Beat display */}
        <BeatFlash beat={currentBeat} numerator={exerciseNumerator} isPlaying={isPlaying}/>

        {/* The binder / tarjetero */}
        <Binder cards={activeNotes} currentCard={currentCard} beatProgress={beatProgress}/>

        {/* Current note info */}
        <div className="current-note-info">
          <span className="note-info-label">Figura actual:</span>
          <span className="note-info-name">
            {activeNotes[currentCard]?.label || '—'}
          </span>
          <span className="note-info-beats">
            {activeNotes[currentCard]?.beats} {activeNotes[currentCard]?.beats === 1 ? 'tiempo' : 'tiempos'}
          </span>
        </div>

        {/* Controls */}
        <div className="play-controls">
          {!isPlaying ? (
            <button className="play-btn" onClick={() => setIsPlaying(true)}>
              ▶ CONTINUAR
            </button>
          ) : (
            <button className="stop-btn" onClick={handleStop}>
              ⏹ PARAR
            </button>
          )}
          <button className="restart-btn" onClick={() => {
            setIsPlaying(false);
            setTimeout(() => {
              setCurrentCard(0);
              setCurrentBeat(0);
              setBeatProgress(0);
              setIsPlaying(true);
            }, 100);
          }}>↺ Reiniciar</button>
        </div>

        {/* Sound toggles */}
        <div className="play-options">
          <button className={`opt-btn ${metronomeOn ? 'opt-on' : ''}`}
            onClick={() => setMetronomeOn(v => !v)}>
            🎵 Metrónomo {metronomeOn ? 'ON' : 'OFF'}
          </button>
          <button className={`opt-btn ${snareOn ? 'opt-on' : ''}`}
            onClick={() => setSnareOn(v => !v)}>
            🥁 Redoblante {snareOn ? 'ON' : 'OFF'}
          </button>
        </div>
      </main>
    </div>
  );
}
