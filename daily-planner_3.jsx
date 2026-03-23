import { useState, useEffect, useCallback } from "react";

const COLORS = [
  { id:"emerald", hex:"#059669", light:"#D1FAE5", dark:"#065F46" },
  { id:"sky",     hex:"#0284C7", light:"#E0F2FE", dark:"#0C4A6E" },
  { id:"violet",  hex:"#7C3AED", light:"#EDE9FE", dark:"#4C1D95" },
  { id:"rose",    hex:"#E11D48", light:"#FFE4E6", dark:"#881337" },
  { id:"amber",   hex:"#D97706", light:"#FEF3C7", dark:"#78350F" },
  { id:"teal",    hex:"#0D9488", light:"#CCFBF1", dark:"#134E4A" },
  { id:"indigo",  hex:"#4F46E5", light:"#E0E7FF", dark:"#1E1B4B" },
  { id:"fuchsia", hex:"#C026D3", light:"#FAE8FF", dark:"#701A75" },
];

const ICONS = ["✦","⊕","◈","⬡","◉","◎","⊞","⊟","⬢","◐","◑","⊘","⬣","◆","◇","▸","▾","⊛","⊜","⬤","◍","⊗","⊙","⊚"];

const CATEGORIES = [
  { id:"focus",    label:"Focus" },
  { id:"health",   label:"Health" },
  { id:"work",     label:"Work" },
  { id:"personal", label:"Personal" },
  { id:"social",   label:"Social" },
  { id:"learning", label:"Learning" },
];

const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function dateKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
const TODAY = new Date();
const TODAY_KEY = dateKey(TODAY);

function getWeekDates(anchor) {
  const base = anchor || new Date();
  const day = base.getDay();
  return Array.from({ length: 7 }, function(_, i) {
    const d = new Date(base);
    d.setDate(base.getDate() - day + i);
    return d;
  });
}

function getStreak(completions) {
  const comp = completions || {};
  let streak = 0;
  const d = new Date();
  if (!comp[dateKey(d)]) d.setDate(d.getDate() - 1);
  while (comp[dateKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function getLast7(completions) {
  const comp = completions || {};
  let c = 0;
  const d = new Date();
  for (let i = 0; i < 7; i++) { if (comp[dateKey(d)]) c++; d.setDate(d.getDate() - 1); }
  return c;
}

function useStorage(key, init) {
  const [val, setVal] = useState(function() {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch(e) { return init; }
  });
  useEffect(function() { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} }, [key, val]);
  return [val, setVal];
}

const DEFAULT_HABITS = [
  { id:"h1", name:"Morning pages",   icon:"◎", colorId:"violet",  category:"focus",    completions:{}, notes:{} },
  { id:"h2", name:"30 min walk",     icon:"⊕", colorId:"emerald", category:"health",   completions:{}, notes:{} },
  { id:"h3", name:"Deep work block", icon:"◈", colorId:"sky",     category:"work",     completions:{}, notes:{} },
  { id:"h4", name:"Read 20 mins",    icon:"◎", colorId:"amber",   category:"learning", completions:{}, notes:{} },
];

const labelStyle = {
  fontSize:12, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase",
  color:"var(--color-text-secondary)", display:"block", marginBottom:8,
};

function Ring({ pct, size, stroke, color }) {
  const s = size || 64;
  const sw = stroke || 5;
  const col = color || "#059669";
  const r = (s - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={s} height={s} style={{ transform:"rotate(-90deg)", display:"block" }}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="var(--color-background-secondary)" strokeWidth={sw} />
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={col} strokeWidth={sw}
        strokeDasharray={dash + " " + circ} strokeLinecap="round"
        style={{ transition:"stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

function Modal({ onClose, children, width }) {
  const w = width || 460;
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
    }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{
        background:"var(--color-background-primary)", borderRadius:20,
        border:"0.5px solid var(--color-border-tertiary)",
        padding:"1.75rem", width:"100%", maxWidth:w, boxSizing:"border-box",
      }}>
        {children}
      </div>
    </div>
  );
}

function HabitForm({ initial, onSave, onClose }) {
  const [name, setName]       = useState(initial ? initial.name : "");
  const [icon, setIcon]       = useState(initial ? initial.icon : "◈");
  const [colorId, setColorId] = useState(initial ? initial.colorId : "emerald");
  const [cat, setCat]         = useState(initial ? initial.category : "focus");
  const color = COLORS.find(function(c){ return c.id === colorId; }) || COLORS[0];
  const valid = name.trim().length > 0;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>{initial ? "Edit habit" : "New habit"}</h2>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"var(--color-text-secondary)" }}>×</button>
      </div>

      <label style={labelStyle}>Name</label>
      <input value={name} onChange={function(e){ setName(e.target.value); }} placeholder="e.g. Meditate 10 mins"
        autoFocus style={{ width:"100%", boxSizing:"border-box", marginBottom:"1.25rem" }} />

      <label style={labelStyle}>Category</label>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:"1.25rem" }}>
        {CATEGORIES.map(function(c) {
          return (
            <button key={c.id} onClick={function(){ setCat(c.id); }} style={{
              padding:"5px 12px", borderRadius:99, fontSize:13, cursor:"pointer",
              background: cat === c.id ? color.hex : "var(--color-background-secondary)",
              color: cat === c.id ? "#fff" : "var(--color-text-primary)",
              border: cat === c.id ? ("1px solid " + color.hex) : "0.5px solid var(--color-border-secondary)",
              fontWeight: cat === c.id ? 600 : 400,
            }}>{c.label}</button>
          );
        })}
      </div>

      <label style={labelStyle}>Color</label>
      <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {COLORS.map(function(c) {
          return (
            <button key={c.id} onClick={function(){ setColorId(c.id); }} style={{
              width:28, height:28, borderRadius:"50%", background:c.hex, cursor:"pointer",
              border: colorId === c.id ? "3px solid var(--color-text-primary)" : "3px solid transparent",
              outline: colorId === c.id ? ("2px solid " + c.hex) : "none", outlineOffset:2,
            }} />
          );
        })}
      </div>

      <label style={labelStyle}>Icon</label>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:"1.5rem" }}>
        {ICONS.map(function(ic) {
          return (
            <button key={ic} onClick={function(){ setIcon(ic); }} style={{
              width:36, height:36, borderRadius:8, fontSize:16, cursor:"pointer",
              background: icon === ic ? color.light : "var(--color-background-secondary)",
              color: icon === ic ? color.dark : "var(--color-text-primary)",
              border: icon === ic ? ("1.5px solid " + color.hex) : "0.5px solid var(--color-border-tertiary)",
              fontFamily:"monospace",
            }}>{ic}</button>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onClose}>Cancel</button>
        <button onClick={function(){ if(valid) onSave({ name:name.trim(), icon:icon, colorId:colorId, category:cat }); }}
          disabled={!valid} style={{
            fontWeight:600,
            background: valid ? color.hex : "var(--color-background-secondary)",
            color: valid ? "#fff" : "var(--color-text-secondary)",
            border:"none", cursor: valid ? "pointer" : "default",
          }}>
          {initial ? "Save changes" : "Add habit"}
        </button>
      </div>
    </div>
  );
}

function NoteModal({ habit, dayKey, onClose, onSave }) {
  const [text, setText] = useState((habit.notes && habit.notes[dayKey]) ? habit.notes[dayKey] : "");
  const color = COLORS.find(function(c){ return c.id === habit.colorId; }) || COLORS[0];
  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ width:32, height:32, borderRadius:8, background:color.light, color:color.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontFamily:"monospace" }}>{habit.icon}</span>
          <div>
            <div style={{ fontWeight:600, fontSize:15 }}>{habit.name}</div>
            <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>Note · {dayKey}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"var(--color-text-secondary)" }}>×</button>
      </div>
      <textarea value={text} onChange={function(e){ setText(e.target.value); }} rows={5}
        placeholder="How did it go? Any reflections..."
        style={{ width:"100%", boxSizing:"border-box", resize:"vertical", fontSize:14,
          padding:"10px 12px", borderRadius:10, border:"0.5px solid var(--color-border-secondary)",
          background:"var(--color-background-secondary)", color:"var(--color-text-primary)", outline:"none" }} />
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:"0.75rem" }}>
        <button onClick={onClose}>Cancel</button>
        <button onClick={function(){ onSave(text); }} style={{
          fontWeight:600, background:color.hex, color:"#fff", border:"none", cursor:"pointer",
        }}>Save note</button>
      </div>
    </Modal>
  );
}

export default function App() {
  const [habits, setHabits]           = useStorage("planner_habits_v5", DEFAULT_HABITS);
  const [tasks,  setTasks]            = useStorage("planner_tasks_v5",  {});
  const [view,   setView]             = useState("today");
  const [showAdd, setShowAdd]         = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [noteFor, setNoteFor]         = useState(null);
  const [weekAnchor, setWeekAnchor]   = useState(new Date());
  const [newTask, setNewTask]         = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");

  const weekDates  = getWeekDates(weekAnchor);
  const todayTasks = tasks[TODAY_KEY] || [];
  const doneTasks  = todayTasks.filter(function(t){ return t.done; }).length;
  const doneHabits = habits.filter(function(h){ return h.completions[TODAY_KEY]; }).length;
  const totalItems = todayTasks.length + habits.length;
  const doneItems  = doneTasks + doneHabits;
  const overallPct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const habitsPct  = totalItems ? Math.round((doneHabits / totalItems) * 100) : 0;
  const tasksPct   = totalItems ? Math.round((doneTasks  / totalItems) * 100) : 0;

  function toggleHabit(id, dKey) {
    const key = dKey || TODAY_KEY;
    setHabits(function(prev) {
      return prev.map(function(h) {
        if (h.id !== id) return h;
        const c = Object.assign({}, h.completions);
        if (c[key]) { delete c[key]; } else { c[key] = true; }
        return Object.assign({}, h, { completions: c });
      });
    });
  }

  function saveNote(habitId, dKey, text) {
    setHabits(function(prev) {
      return prev.map(function(h) {
        if (h.id !== habitId) return h;
        const notes = Object.assign({}, h.notes, { [dKey]: text });
        if (!text) delete notes[dKey];
        return Object.assign({}, h, { notes: notes });
      });
    });
    setNoteFor(null);
  }

  function addTask() {
    if (!newTask.trim()) return;
    const t = { id: Date.now().toString(), text: newTask.trim(), done: false, time: newTaskTime };
    setTasks(function(prev) {
      const existing = prev[TODAY_KEY] || [];
      return Object.assign({}, prev, { [TODAY_KEY]: existing.concat([t]) });
    });
    setNewTask(""); setNewTaskTime("");
  }

  function toggleTask(id) {
    setTasks(function(prev) {
      const updated = (prev[TODAY_KEY] || []).map(function(t) {
        return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
      });
      return Object.assign({}, prev, { [TODAY_KEY]: updated });
    });
  }

  function deleteTask(id) {
    setTasks(function(prev) {
      const updated = (prev[TODAY_KEY] || []).filter(function(t){ return t.id !== id; });
      return Object.assign({}, prev, { [TODAY_KEY]: updated });
    });
  }

  function addHabit(data) {
    setHabits(function(prev) {
      return prev.concat([Object.assign({ id: Date.now().toString(), completions:{}, notes:{} }, data)]);
    });
    setShowAdd(false);
  }

  function saveEdit(data) {
    setHabits(function(prev) {
      return prev.map(function(h) { return h.id === editing.id ? Object.assign({}, h, data) : h; });
    });
    setEditing(null);
  }

  const sortedTasks = todayTasks.slice().sort(function(a, b) {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  function NavBtn(props) {
    const active = view === props.id;
    return (
      <button onClick={function(){ setView(props.id); }} style={{
        flex:1, padding:"9px 4px", fontSize:12, cursor:"pointer",
        fontWeight: active ? 700 : 400,
        background: active ? "var(--color-background-primary)" : "none",
        border: active ? "0.5px solid var(--color-border-tertiary)" : "none",
        borderRadius:10,
        color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
      }}>
        <span style={{ fontSize:16, fontFamily:"monospace" }}>{props.icon}</span>
        {props.label}
      </button>
    );
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", paddingBottom:"2rem" }}>

      {/* Header */}
      <div style={{ padding:"1.5rem 1.25rem 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.25rem" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--color-text-secondary)", marginBottom:4 }}>
              {TODAY.toLocaleDateString("en-US", { weekday:"long" })}
            </div>
            <div style={{ fontSize:26, fontWeight:700, lineHeight:1.1 }}>
              {TODAY.toLocaleDateString("en-US", { month:"long", day:"numeric" })}
            </div>
          </div>
          <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
            <Ring pct={overallPct} size={64} stroke={5} color="#059669" />
            <div style={{ position:"absolute", display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1.1 }}>
              <span style={{ fontSize:14, fontWeight:700 }}>{overallPct}%</span>
              <span style={{ fontSize:9, color:"var(--color-text-secondary)", fontWeight:700, letterSpacing:"0.05em" }}>DONE</span>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:"1rem", flexWrap:"wrap" }}>
          {[doneHabits + "/" + habits.length + " habits", doneTasks + "/" + todayTasks.length + " tasks", doneItems + " total done"].map(function(label, i) {
            return (
              <div key={i} style={{
                padding:"4px 10px", borderRadius:99, fontSize:12, fontWeight:600,
                background:"var(--color-background-secondary)", color:"var(--color-text-secondary)",
                border:"0.5px solid var(--color-border-tertiary)",
              }}>{label}</div>
            );
          })}
        </div>

        {/* Segmented progress bar */}
        <div style={{ height:8, background:"var(--color-background-secondary)", borderRadius:99, overflow:"hidden", marginBottom:"1.25rem", position:"relative" }}>
          <div style={{ position:"absolute", height:"100%", borderRadius:99, background:"#7C3AED", left:"0%", width:habitsPct + "%", transition:"width 0.5s ease" }} />
          <div style={{ position:"absolute", height:"100%", borderRadius:99, background:"#0284C7", left:habitsPct + "%", width:tasksPct + "%", transition:"width 0.5s ease" }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, padding:"4px", background:"var(--color-background-secondary)", borderRadius:12, margin:"0 1.25rem 1.25rem" }}>
        <NavBtn id="today" label="Today"  icon="◉" />
        <NavBtn id="week"  label="Week"   icon="⬡" />
        <NavBtn id="stats" label="Stats"  icon="◈" />
      </div>

      <div style={{ padding:"0 1.25rem" }}>

        {/* TODAY */}
        {view === "today" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-secondary)", marginBottom:10 }}>Today's plan</div>

            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input type="time" value={newTaskTime} onChange={function(e){ setNewTaskTime(e.target.value); }} style={{ width:108, flexShrink:0 }} />
              <input value={newTask} onChange={function(e){ setNewTask(e.target.value); }}
                onKeyDown={function(e){ if(e.key==="Enter") addTask(); }}
                placeholder="Add a task or event..." style={{ flex:1 }} />
              <button onClick={addTask} style={{
                background:"#0284C7", color:"#fff", border:"none", borderRadius:8,
                padding:"0 14px", cursor:"pointer", fontWeight:700, flexShrink:0, fontSize:18,
              }}>+</button>
            </div>

            {sortedTasks.length === 0 && (
              <div style={{ fontSize:13, color:"var(--color-text-secondary)", paddingBottom:"1rem" }}>Nothing planned yet — add something above.</div>
            )}

            {sortedTasks.map(function(t) {
              return (
                <div key={t.id} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                  borderRadius:10, marginBottom:6,
                  background: t.done ? "var(--color-background-secondary)" : "var(--color-background-primary)",
                  border:"0.5px solid var(--color-border-tertiary)", opacity: t.done ? 0.65 : 1,
                }}>
                  <button onClick={function(){ toggleTask(t.id); }} style={{
                    width:20, height:20, borderRadius:"50%", flexShrink:0, cursor:"pointer",
                    background: t.done ? "#0284C7" : "none",
                    border: "1.5px solid " + (t.done ? "#0284C7" : "var(--color-border-secondary)"),
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, color:"#fff", fontWeight:700,
                  }}>{t.done ? "✓" : ""}</button>
                  {t.time && <span style={{ fontSize:11, color:"var(--color-text-secondary)", fontWeight:600, flexShrink:0 }}>{t.time}</span>}
                  <span style={{ flex:1, fontSize:14, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                  <button onClick={function(){ deleteTask(t.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"var(--color-text-secondary)", padding:4, opacity:0.5 }}>×</button>
                </div>
              );
            })}

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"1.25rem 0 10px" }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-secondary)" }}>Habits</div>
              <button onClick={function(){ setShowAdd(true); }} style={{
                background:"none", border:"0.5px solid var(--color-border-secondary)",
                borderRadius:8, padding:"4px 10px", fontSize:12, cursor:"pointer", fontWeight:600,
              }}>+ Add habit</button>
            </div>

            {habits.length === 0 && <div style={{ fontSize:13, color:"var(--color-text-secondary)" }}>No habits yet.</div>}

            {habits.map(function(h) {
              const color   = COLORS.find(function(c){ return c.id === h.colorId; }) || COLORS[0];
              const done    = !!h.completions[TODAY_KEY];
              const streak  = getStreak(h.completions);
              const hasNote = !!(h.notes && h.notes[TODAY_KEY]);
              const pct7    = Math.round((getLast7(h.completions) / 7) * 100);
              return (
                <div key={h.id} style={{
                  borderRadius:12, marginBottom:8, overflow:"hidden",
                  border: "0.5px solid " + (done ? color.hex + "66" : "var(--color-border-tertiary)"),
                  background: done ? color.light + "55" : "var(--color-background-primary)",
                  transition:"border-color 0.25s, background 0.25s",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
                    <button onClick={function(){ toggleHabit(h.id); }} style={{
                      width:36, height:36, borderRadius:10, flexShrink:0, cursor:"pointer",
                      background: done ? color.hex : "var(--color-background-secondary)",
                      border: "1.5px solid " + (done ? color.hex : "var(--color-border-secondary)"),
                      fontSize:16, fontFamily:"monospace",
                      color: done ? "#fff" : color.hex,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>{done ? "✓" : h.icon}</button>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{
                          fontSize:15, fontWeight:600,
                          textDecoration: done ? "line-through" : "none",
                          color: done ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                        }}>{h.name}</span>
                        {streak > 0 && (
                          <span style={{ fontSize:11, fontWeight:700, color:color.dark, background:color.light, padding:"2px 7px", borderRadius:99 }}>
                            {"🔥 " + streak + "d"}
                          </span>
                        )}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                        <div style={{ width:80, height:3, background:"var(--color-background-secondary)", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:pct7 + "%", background:color.hex, borderRadius:99 }} />
                        </div>
                        <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>{pct7}% this week</span>
                      </div>
                    </div>

                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      <button onClick={function(){ setNoteFor({ habit:h, dayKey:TODAY_KEY }); }} style={{
                        background: hasNote ? color.light : "none",
                        border: "0.5px solid " + (hasNote ? color.hex : "var(--color-border-tertiary)"),
                        borderRadius:7, padding:"5px 7px", cursor:"pointer", fontSize:13,
                        color: hasNote ? color.dark : "var(--color-text-secondary)",
                      }}>✎</button>
                      <button onClick={function(){ setEditing(h); }} style={{ background:"none", border:"0.5px solid var(--color-border-tertiary)", borderRadius:7, padding:"5px 7px", cursor:"pointer", fontSize:13, color:"var(--color-text-secondary)" }}>⊙</button>
                      <button onClick={function(){ setDeleting(h.id); }} style={{ background:"none", border:"0.5px solid var(--color-border-tertiary)", borderRadius:7, padding:"5px 7px", cursor:"pointer", fontSize:14, color:"var(--color-text-secondary)" }}>×</button>
                    </div>
                  </div>
                  {hasNote && (
                    <div style={{ fontSize:12, color:"var(--color-text-secondary)", padding:"0 14px 10px 60px", fontStyle:"italic" }}>
                      {'"' + h.notes[TODAY_KEY] + '"'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* WEEK */}
        {view === "week" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <button onClick={function(){ const d=new Date(weekAnchor); d.setDate(d.getDate()-7); setWeekAnchor(d); }} style={{ background:"none", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Prev</button>
              <span style={{ fontSize:13, fontWeight:600 }}>
                {weekDates[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {weekDates[6].toLocaleDateString("en-US",{month:"short",day:"numeric"})}
              </span>
              <button onClick={function(){ const d=new Date(weekAnchor); d.setDate(d.getDate()+7); setWeekAnchor(d); }} style={{ background:"none", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>Next →</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) repeat(7,32px)", gap:4, marginBottom:8 }}>
              <div />
              {weekDates.map(function(d, i) {
                const isToday = dateKey(d) === TODAY_KEY;
                return (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:10, color: isToday ? "#059669" : "var(--color-text-secondary)", fontWeight: isToday ? 700 : 400 }}>{DAY_SHORT[d.getDay()]}</div>
                    <div style={{
                      fontSize:11, fontWeight: isToday ? 700 : 400,
                      color: isToday ? "#fff" : "var(--color-text-secondary)",
                      background: isToday ? "#059669" : "none",
                      borderRadius:"50%", width:22, height:22, lineHeight:"22px",
                      textAlign:"center", margin:"2px auto 0",
                    }}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {habits.length === 0 && <div style={{ fontSize:13, color:"var(--color-text-secondary)" }}>No habits yet.</div>}

            {habits.map(function(h) {
              const color = COLORS.find(function(c){ return c.id === h.colorId; }) || COLORS[0];
              return (
                <div key={h.id} style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) repeat(7,32px)", gap:4, marginBottom:8, alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, overflow:"hidden" }}>
                    <span style={{ fontFamily:"monospace", fontSize:14, color:color.hex, flexShrink:0 }}>{h.icon}</span>
                    <span style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.name}</span>
                  </div>
                  {weekDates.map(function(d, i) {
                    const dk       = dateKey(d);
                    const done     = !!h.completions[dk];
                    const isFuture = d > TODAY && dk !== TODAY_KEY;
                    const hasNote  = !!(h.notes && h.notes[dk]);
                    return (
                      <div key={i} style={{ position:"relative" }}>
                        <button onClick={function(){ if(!isFuture) toggleHabit(h.id, dk); }} style={{
                          width:32, height:32, borderRadius:7, cursor: isFuture ? "default" : "pointer",
                          background: done ? color.hex : "var(--color-background-secondary)",
                          border: "0.5px solid " + (done ? color.hex : "var(--color-border-tertiary)"),
                          fontSize:12, color:"#fff", fontWeight:700,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          opacity: isFuture ? 0.25 : 1,
                        }}>{done ? "✓" : ""}</button>
                        {hasNote && <div style={{ position:"absolute", top:-2, right:-2, width:7, height:7, borderRadius:"50%", background:color.hex, border:"1.5px solid var(--color-background-primary)" }} />}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* STATS */}
        {view === "stats" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:"1.25rem" }}>
              {[
                { label:"Total habits",  value: habits.length },
                { label:"Done today",    value: doneHabits },
                { label:"Best streak",   value: (habits.length ? Math.max.apply(null, habits.map(function(h){ return getStreak(h.completions); })) : 0) + "d" },
                { label:"Day complete",  value: overallPct + "%" },
              ].map(function(m, i) {
                return (
                  <div key={i} style={{ background:"var(--color-background-secondary)", borderRadius:12, padding:"14px 16px" }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--color-text-secondary)", marginBottom:6 }}>{m.label}</div>
                    <div style={{ fontSize:28, fontWeight:700 }}>{m.value}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-secondary)", marginBottom:10 }}>Per habit — last 7 days</div>

            {habits.length === 0 && <div style={{ fontSize:13, color:"var(--color-text-secondary)" }}>No habits yet.</div>}

            {habits.map(function(h) {
              const color     = COLORS.find(function(c){ return c.id === h.colorId; }) || COLORS[0];
              const count     = getLast7(h.completions);
              const pct       = Math.round((count / 7) * 100);
              const streak    = getStreak(h.completions);
              const noteCount = Object.keys(h.notes || {}).length;
              const catLabel  = (CATEGORIES.find(function(c){ return c.id === h.category; }) || { label: h.category }).label;
              return (
                <div key={h.id} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:color.light, color:color.dark, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontFamily:"monospace", flexShrink:0 }}>{h.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{h.name}</div>
                      <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>
                        {catLabel}{noteCount > 0 ? (" · " + noteCount + (noteCount > 1 ? " notes" : " note")) : ""}
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:24, fontWeight:700, color:color.hex }}>{pct}%</div>
                      {streak > 0 && <div style={{ fontSize:11, color:"var(--color-text-secondary)" }}>{"🔥 " + streak + "d streak"}</div>}
                    </div>
                  </div>
                  <div style={{ height:6, background:"var(--color-background-secondary)", borderRadius:99, overflow:"hidden", marginBottom:8 }}>
                    <div style={{ height:"100%", width:pct + "%", background:color.hex, borderRadius:99, transition:"width 0.5s" }} />
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {Array.from({ length: 7 }, function(_, i) {
                      const d = new Date();
                      d.setDate(d.getDate() - 6 + i);
                      const dk   = dateKey(d);
                      const done = !!h.completions[dk];
                      return (
                        <div key={i} style={{ flex:1, height:8, borderRadius:99, background: done ? color.hex : "var(--color-background-secondary)" }} />
                      );
                    })}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontSize:10, color:"var(--color-text-secondary)" }}>7 days ago</span>
                    <span style={{ fontSize:10, color:"var(--color-text-secondary)" }}>today</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal onClose={function(){ setShowAdd(false); }}>
          <HabitForm onSave={addHabit} onClose={function(){ setShowAdd(false); }} />
        </Modal>
      )}
      {editing && (
        <Modal onClose={function(){ setEditing(null); }}>
          <HabitForm initial={editing} onSave={saveEdit} onClose={function(){ setEditing(null); }} />
        </Modal>
      )}
      {noteFor && (
        <NoteModal
          habit={noteFor.habit}
          dayKey={noteFor.dayKey}
          onClose={function(){ setNoteFor(null); }}
          onSave={function(txt){ saveNote(noteFor.habit.id, noteFor.dayKey, txt); }}
        />
      )}
      {deleting && (
        <Modal onClose={function(){ setDeleting(null); }} width={360}>
          <h2 style={{ margin:"0 0 0.75rem", fontSize:18, fontWeight:600 }}>Delete habit?</h2>
          <p style={{ fontSize:14, color:"var(--color-text-secondary)", margin:"0 0 1.25rem" }}>This removes the habit and all its history permanently.</p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={function(){ setDeleting(null); }}>Cancel</button>
            <button onClick={function(){ setHabits(function(prev){ return prev.filter(function(h){ return h.id !== deleting; }); }); setDeleting(null); }} style={{ fontWeight:700, background:"#E11D48", color:"#fff", border:"none", cursor:"pointer" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
