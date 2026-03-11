import { useState, useEffect, useRef } from "react";

// ─── MUSIC ENGINE ─────────────────────────────────────────────────────────────
const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const FLAT_KEYS = ['F','Bb','Eb','Ab','Db','Gb'];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const DEGREE_LABELS   = ['I','II','III','IV','V','VI','VII'];
const DEGREE_QUALITIES= ['maj7','m7','m7','maj7','7','m7','m7b5'];
const ALL_KEYS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

function noteIndex(n) {
  let i = SHARP.indexOf(n); if (i !== -1) return i;
  return FLAT.indexOf(n);
}
function transposeNote(n, semi, flat) {
  const i = noteIndex(n); if (i === -1) return n;
  const ni = ((i + semi) % 12 + 12) % 12;
  return flat ? FLAT[ni] : SHARP[ni];
}
function parseChord(chord) {
  if (!chord || chord === '—' || chord === '%') return { root: chord, quality: '' };
  const m = chord.match(/^([A-G][b#]?)(.*)/);
  return m ? { root: m[1], quality: m[2] } : { root: chord, quality: '' };
}
function transposeChord(chord, semi, flat) {
  if (!chord || chord === '—' || chord === '%') return chord;
  const { root, quality } = parseChord(chord);
  return transposeNote(root, semi, flat) + quality;
}
function buildScale(key) {
  const flat = FLAT_KEYS.includes(key);
  return MAJOR_INTERVALS.map((iv, i) => {
    const ni = ((noteIndex(key) + iv) % 12 + 12) % 12;
    const note = flat ? FLAT[ni] : SHARP[ni];
    return { degree: DEGREE_LABELS[i], note, quality: DEGREE_QUALITIES[i] };
  });
}
function chordToDegree(chord, key) {
  const { root, quality } = parseChord(chord);
  const ci = noteIndex(root); const ki = noteIndex(key);
  if (ci === -1 || ki === -1) return null;
  const iv = ((ci - ki) % 12 + 12) % 12;
  const di = MAJOR_INTERVALS.indexOf(iv);
  if (di === -1) return null;
  return DEGREE_LABELS[di] + quality;
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const LIBRARY = [
  { id: 1, title: "Autumn Leaves", key: "Bb", bpm: 112, style: "Jazz standard",
    sections: [
      { name: "A", measures: [["Cm7","F7"],["Bbmaj7"],["Ebmaj7"],["Am7b5","D7"],["Gm7"],["Gm7"],["Am7b5","D7"],["Gm7"]] },
      { name: "B", measures: [["Am7b5","D7"],["Gm7"],["Gm7","C7"],["Fmaj7"],["Fm7","Bb7"],["Ebmaj7"],["Am7b5","D7"],["Gm7"]] },
    ]},
  { id: 2, title: "Misty", key: "Eb", bpm: 88, style: "Jazz ballad",
    sections: [
      { name: "A", measures: [["Ebmaj7"],["Bbm7","Eb7"],["Abmaj7"],["Abm7","Db7"],["Ebmaj7","Cm7"],["Fm7","Bb7"],["Ebmaj7"],["Ebmaj7"]] },
    ]},
  { id: 3, title: "So What", key: "D", bpm: 136, style: "Modal jazz",
    sections: [
      { name: "A", measures: [["Dm7"],["Dm7"],["Dm7"],["Dm7"],["Dm7"],["Dm7"],["Dm7"],["Dm7"]] },
      { name: "B", measures: [["Ebm7"],["Ebm7"],["Ebm7"],["Ebm7"],["Dm7"],["Dm7"],["Dm7"],["Dm7"]] },
    ]},
  { id: 4, title: "All The Things You Are", key: "Ab", bpm: 104, style: "Jazz standard",
    sections: [
      { name: "A", measures: [["Fm7"],["Bbm7"],["Eb7"],["Abmaj7"],["Dbmaj7"],["Dø7","G7"],["Cmaj7"],["Cmaj7"]] },
    ]},
  { id: 5, title: "Round Midnight", key: "Eb", bpm: 60, style: "Jazz ballad",
    sections: [
      { name: "A", measures: [["Ebm7"],["Bbø7","Bb7"],["Ebm7"],["Ebm7","Ab7"],["Dbmaj7"],["Dbmaj7"],["Bbø7","Bb7"],["Ebm7"]] },
    ]},
  { id: 6, title: "Take Five", key: "Eb", bpm: 174, style: "Cool jazz",
    sections: [
      { name: "A", measures: [["Ebm7"],["Bbm7"],["Ebm7"],["Bbm7"],["Ebm7"],["Bbm7"],["Ebm7"],["Bbm7"]] },
    ]},
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif", background: '#0B0F17', minHeight: '100vh', color: '#E6EDF3', display: 'flex', flexDirection: 'column', fontSize: 14 },
  // Top bar
  topBar: { background: '#111827', borderBottom: '1px solid #1F2937', height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, position: 'sticky', top: 0, zIndex: 200 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 },
  logoIcon: { width: 30, height: 30, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, lineHeight: 1, flexShrink: 0 },
  logoText: { fontSize: 19, fontWeight: 800, color: '#F9FAFB', letterSpacing: '-0.8px' },
  divider: { width: 1, height: 24, background: '#1F2937', margin: '0 4px' },
  pieceTitle: { fontSize: 14, fontWeight: 600, color: '#D1D5DB' },
  tag: { fontSize: 11, color: '#6B7280', background: '#1F2937', padding: '2px 7px', borderRadius: 4, fontWeight: 500 },
  flex1: { flex: 1 },
  // Controls
  select: { background: '#1F2937', border: '1px solid #374151', color: '#E6EDF3', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none' },
  btn: (active, accent) => ({
    background: active ? (accent || '#1D4ED820') : 'transparent',
    border: `1px solid ${active ? (accent ? accent + '60' : '#3B82F660') : '#374151'}`,
    color: active ? (accent ? '#FDE68A' : '#93C5FD') : '#9CA3AF',
    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.5,
  }),
  iconBtn: (active) => ({
    background: active ? '#1C2E1F' : 'transparent',
    border: `1px solid ${active ? '#22C55E50' : '#374151'}`,
    color: active ? '#4ADE80' : '#6B7280',
    width: 30, height: 30, borderRadius: 6, cursor: 'pointer', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'all 0.15s',
  }),
  // Body
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  // Sidebar
  sidebar: { width: 196, background: '#0D1117', borderRight: '1px solid #1F2937', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHead: { fontSize: 10, color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, padding: '14px 14px 8px' },
  sidebarItem: (active) => ({
    padding: '8px 14px', borderRadius: 6, margin: '1px 6px', cursor: 'pointer', fontSize: 13,
    color: active ? '#E6EDF3' : '#6B7280', fontWeight: active ? 600 : 400,
    background: active ? '#1F2937' : 'transparent',
    borderLeft: active ? '2px solid #F59E0B' : '2px solid transparent',
    transition: 'all 0.1s',
  }),
  sidebarSub: { fontSize: 10, color: '#4B5563', marginTop: 2 },
  // Editor
  editor: { flex: 1, overflowY: 'auto', padding: '24px 28px', position: 'relative' },
  editorHeader: { marginBottom: 24 },
  editorTitle: { fontSize: 24, fontWeight: 800, color: '#F9FAFB', margin: '0 0 6px', letterSpacing: '-0.5px' },
  editorMeta: { fontSize: 12, color: '#4B5563', display: 'flex', gap: 12, alignItems: 'center' },
  metaDot: { width: 3, height: 3, borderRadius: '50%', background: '#374151' },
  // Section
  sectionLabel: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionTag: { background: '#F59E0B', color: '#0D1117', fontSize: 11, fontWeight: 800, width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionLine: { flex: 1, height: 1, background: '#1F2937' },
  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 24 },
  measure: (selected, isCurrentBeat) => ({
    background: isCurrentBeat ? '#1A2535' : selected ? '#161D2C' : '#111827',
    border: `1px solid ${isCurrentBeat ? '#3B82F6' : selected ? '#2D4A7A' : '#1F2937'}`,
    borderRadius: 8, padding: '10px 10px 8px',
    cursor: 'pointer', minHeight: 62,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    position: 'relative', transition: 'all 0.12s',
  }),
  measureNum: { position: 'absolute', top: 4, left: 7, fontSize: 9, color: '#374151', fontWeight: 500, lineHeight: 1 },
  chordDisplay: (size, isDiatonic, degreeMode) => ({
    fontSize: size, fontWeight: 700, letterSpacing: '-0.3px', cursor: 'text',
    color: degreeMode ? (isDiatonic ? '#93C5FD' : '#FCA5A5') : '#F9FAFB',
    background: degreeMode && !isDiatonic ? '#1F1010' : 'transparent',
    padding: '1px 4px', borderRadius: 3, lineHeight: 1.2,
  }),
  // Degrees panel
  degreesPanel: { position: 'absolute', top: 16, right: 16, background: '#111827EE', border: '1px solid #1F2937', borderRadius: 10, padding: '10px 12px', backdropFilter: 'blur(12px)', minWidth: 148, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  degreesPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1F2937' },
  degreesPanelTitle: { fontSize: 10, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: 1 },
  degreeRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', borderRadius: 4, cursor: 'default' },
  // Chord input
  chordInput: { width: 80, background: '#0D1117', border: '1px solid #F59E0B', color: '#FDE68A', fontSize: 17, fontWeight: 700, textAlign: 'center', borderRadius: 4, padding: '2px 4px', outline: 'none' },
  // Metronome bar
  metroWrap: { display: 'flex', alignItems: 'center', gap: 8, background: '#111827', border: '1px solid #1F2937', borderRadius: 8, padding: '4px 10px' },
  metroDot: (active, accent) => ({ width: 7, height: 7, borderRadius: '50%', background: active ? (accent ? '#F59E0B' : '#60A5FA') : '#1F2937', transition: 'background 0.04s', boxShadow: active ? `0 0 8px ${accent ? '#F59E0B80' : '#60A5FA80'}` : 'none' }),
  metroInput: { width: 42, background: 'transparent', border: 'none', color: '#E6EDF3', fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none' },
  metroLabel: { fontSize: 10, color: '#4B5563', fontWeight: 600 },
  metroBtn: (on) => ({ background: on ? '#064E3B' : '#1F2937', border: 'none', color: on ? '#34D399' : '#6B7280', width: 24, height: 24, borderRadius: 5, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  // Bottom toolbar
  bottomBar: { background: '#111827', borderTop: '1px solid #1F2937', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 16px' },
  toolBtn: (active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '6px 18px', background: active ? '#1F2937' : 'transparent',
    border: `1px solid ${active ? '#374151' : 'transparent'}`,
    borderRadius: 8, color: active ? '#60A5FA' : '#4B5563',
    cursor: 'pointer', fontSize: 20, lineHeight: 1, transition: 'all 0.1s',
  }),
  toolLabel: { fontSize: 10, fontWeight: 500, lineHeight: 1 },
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
function MetronomeDot({ beats, currentBeat, active }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={S.metroDot(active && currentBeat === i, i === 0)} />
      ))}
    </div>
  );
}

function DegreesPanel({ scale, displayKey, onClose }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={S.degreesPanel}>
      <div style={S.degreesPanelHeader}>
        <span style={S.degreesPanelTitle}>{displayKey} maj</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}>×</button>
      </div>
      {scale.map((item, i) => (
        <div key={i}
          style={{ ...S.degreeRow, background: hovered === i ? '#1F2937' : 'transparent' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, width: 22, textAlign: 'right', flexShrink: 0 }}>{item.degree}</span>
          <span style={{ fontSize: 10, color: '#374151' }}>—</span>
          <span style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 600 }}>
            {item.note}
            <span style={{ fontSize: 10, color: '#4B5563', fontWeight: 400 }}>{item.quality}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activePieceId, setActivePieceId] = useState(1);
  const [library, setLibrary] = useState(LIBRARY);
  const [displayKey, setDisplayKey] = useState('Bb');
  const [degreeMode, setDegreeMode] = useState(false);
  const [showDegrees, setShowDegrees] = useState(false);
  const [activeTool, setActiveTool] = useState('Grille');
  const [bpm, setBpm] = useState(112);
  const [metroOn, setMetroOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const metroRef = useRef(null);
  const beatRef = useRef(0);

  const piece = library.find(p => p.id === activePieceId) || library[0];
  const useFlat = FLAT_KEYS.includes(displayKey);
  const scale = buildScale(displayKey);

  // Switch piece
  function switchPiece(p) {
    setActivePieceId(p.id);
    setDisplayKey(p.key);
    setBpm(p.bpm);
    setDegreeMode(false);
    setSelectedMeasure(null);
    setEditingCell(null);
  }

  // Metronome
  useEffect(() => {
    if (metroOn) {
      const ms = 60000 / bpm;
      metroRef.current = setInterval(() => {
        beatRef.current = (beatRef.current + 1) % 4;
        setBeat(beatRef.current);
      }, ms);
    } else {
      clearInterval(metroRef.current);
      setBeat(0); beatRef.current = 0;
    }
    return () => clearInterval(metroRef.current);
  }, [metroOn, bpm]);

  // Key change → transpose whole piece
  function handleKeyChange(newKey) {
    const oldIdx = noteIndex(piece.key);
    const newIdx = noteIndex(newKey);
    const semi = ((newIdx - oldIdx) % 12 + 12) % 12;
    const flat = FLAT_KEYS.includes(newKey);
    const updated = library.map(p => p.id !== piece.id ? p : {
      ...p,
      key: newKey,
      sections: p.sections.map(s => ({
        ...s,
        measures: s.measures.map(m => m.map(c => transposeChord(c, semi, flat)))
      }))
    });
    setLibrary(updated);
    setDisplayKey(newKey);
  }

  // Chord display
  function getDisplayChord(chord) {
    if (!degreeMode) return chord;
    return chordToDegree(chord, displayKey) || chord + ' ✱';
  }

  // Edit
  function startEdit(si, mi, ci, chord, e) {
    e.stopPropagation();
    setEditingCell({ si, mi, ci });
    setEditValue(chord);
  }
  function commitEdit() {
    if (!editingCell) return;
    const { si, mi, ci } = editingCell;
    const updated = library.map(p => p.id !== piece.id ? p : {
      ...p,
      sections: p.sections.map((s, sIdx) => sIdx !== si ? s : {
        ...s,
        measures: s.measures.map((m, mIdx) => mIdx !== mi ? m :
          m.map((c, cIdx) => cIdx !== ci ? c : editValue)
        )
      })
    });
    setLibrary(updated);
    setEditingCell(null);
  }

  const tools = [
    { label: 'Grille', icon: '♯' },
    { label: 'Partition', icon: '𝄞' },
    { label: 'Tablature', icon: '═' },
    { label: 'Texte', icon: 'T' },
    { label: 'Image', icon: '⬚' },
    { label: 'Dessin', icon: '✏' },
  ];

  let measureCounter = 0;

  return (
    <div style={S.app}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={S.topBar}>

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoIcon}>𝄾</div>
          <span style={S.logoText}>Soupir.</span>
        </div>

        <div style={S.divider} />

        {/* Piece title + tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={S.pieceTitle}>{piece.title}</span>
          <span style={S.tag}>{piece.style}</span>
        </div>

        {/* Key */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#4B5563', fontWeight: 600 }}>Tonalité</span>
          <select value={displayKey} onChange={e => handleKeyChange(e.target.value)} style={S.select}>
            {ALL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Chord / Degree toggle */}
        <button
          onClick={() => setDegreeMode(d => !d)}
          style={S.btn(degreeMode)}
        >
          {degreeMode ? '◈ Degrés' : '◈ Accords'}
        </button>

        {/* Metronome */}
        <div style={S.metroWrap}>
          <MetronomeDot active={metroOn} currentBeat={beat} />
          <input
            type="number" value={bpm} min={40} max={300}
            onChange={e => setBpm(Number(e.target.value))}
            style={S.metroInput}
          />
          <span style={S.metroLabel}>BPM</span>
          <button onClick={() => setMetroOn(m => !m)} style={S.metroBtn(metroOn)}>
            {metroOn ? '■' : '▶'}
          </button>
        </div>

        {/* Degrees panel toggle — subtle icon button */}
        <button
          onClick={() => setShowDegrees(v => !v)}
          title="Afficher le panneau des degrés"
          style={S.iconBtn(showDegrees)}
        >
          ♩
        </button>

      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div style={S.body}>

        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sidebarHead}>Bibliothèque</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
            {library.map(p => (
              <div key={p.id} style={S.sidebarItem(p.id === activePieceId)} onClick={() => switchPiece(p)}>
                <div>{p.title}</div>
                <div style={S.sidebarSub}>{p.key} · {p.bpm} BPM</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1F2937', padding: '8px 6px' }}>
            <div style={{ ...S.sidebarItem(false), display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 12 }}>Nouveau morceau</span>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div style={S.editor} onClick={() => setSelectedMeasure(null)}>

          {/* Header */}
          <div style={S.editorHeader}>
            <h1 style={S.editorTitle}>{piece.title}</h1>
            <div style={S.editorMeta}>
              <span>{displayKey} majeur</span>
              <div style={S.metaDot} />
              <span>{bpm} BPM</span>
              <div style={S.metaDot} />
              <span>4/4</span>
              <div style={S.metaDot} />
              <span style={{ color: '#374151' }}>
                {degreeMode ? '▶ Mode degrés' : '▶ Mode accords'}
              </span>
            </div>
          </div>

          {/* Sections */}
          {piece.sections.map((section, si) => {
            return (
              <div key={si} style={{ marginBottom: 28 }}>
                <div style={S.sectionLabel}>
                  <div style={S.sectionTag}>{section.name}</div>
                  <div style={S.sectionLine} />
                  <span style={{ fontSize: 10, color: '#374151', marginLeft: 4 }}>
                    {section.measures.length} mesures
                  </span>
                </div>

                <div style={S.grid}>
                  {section.measures.map((measure, mi) => {
                    measureCounter++;
                    const mNum = measureCounter;
                    const isSelected = selectedMeasure?.si === si && selectedMeasure?.mi === mi;
                    const isCurrentBeat = metroOn && beat === 0 && isSelected;

                    return (
                      <div
                        key={mi}
                        style={S.measure(isSelected, isCurrentBeat)}
                        onClick={e => { e.stopPropagation(); setSelectedMeasure({ si, mi }); }}
                      >
                        <span style={S.measureNum}>{mNum}</span>

                        <div style={{
                          display: 'flex',
                          gap: 6,
                          alignItems: 'center',
                          justifyContent: measure.length === 1 ? 'center' : 'space-evenly',
                          flexWrap: 'wrap',
                          padding: '4px 0 2px',
                        }}>
                          {measure.map((chord, ci) => {
                            const isEditing = editingCell?.si === si && editingCell?.mi === mi && editingCell?.ci === ci;
                            const isDiatonic = chordToDegree(chord, displayKey) !== null;
                            const displayChord = getDisplayChord(chord);
                            const chordSize = measure.length === 1 ? 22 : 17;

                            if (isEditing) {
                              return (
                                <input
                                  key={ci}
                                  value={editValue}
                                  autoFocus
                                  style={S.chordInput}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
                                  onClick={e => e.stopPropagation()}
                                />
                              );
                            }

                            return (
                              <span
                                key={ci}
                                style={S.chordDisplay(chordSize, isDiatonic, degreeMode)}
                                onDoubleClick={e => startEdit(si, mi, ci, chord, e)}
                                title="Double-cliquer pour modifier"
                              >
                                {displayChord}
                              </span>
                            );
                          })}
                        </div>

                        {/* Separator between 2 chords */}
                        {measure.length === 2 && (
                          <div style={{ position: 'absolute', left: '50%', top: '20%', bottom: '20%', width: 1, background: '#1F2937' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Hint */}
          <div style={{ textAlign: 'center', color: '#1F2937', fontSize: 11, marginTop: 4 }}>
            Double-cliquer sur un accord pour le modifier · Changer la tonalité pour transposer automatiquement
          </div>

          {/* Degrees panel — absolute overlay, top-right */}
          {showDegrees && (
            <DegreesPanel scale={scale} displayKey={displayKey} onClose={() => setShowDegrees(false)} />
          )}

        </div>
      </div>

      {/* ── BOTTOM TOOLBAR ──────────────────────────────────────────────────── */}
      <div style={S.bottomBar}>
        {tools.map(t => (
          <button key={t.label} style={S.toolBtn(activeTool === t.label)} onClick={() => setActiveTool(t.label)}>
            <span>{t.icon}</span>
            <span style={S.toolLabel}>{t.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
