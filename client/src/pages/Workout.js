import React, { useState, useEffect } from 'react';
import { useDate } from '../hooks/useDate';
import { Card } from '../components/Card';
import { getWorkouts, addWorkout, deleteWorkout } from '../db/database';
import './Pages.css';

const CAL_PER_MIN = {
  Running:{light:6,moderate:9,hard:13}, Cycling:{light:5,moderate:8,hard:12},
  Gym:{light:4,moderate:6,hard:10}, HIIT:{light:7,moderate:11,hard:15},
  Yoga:{light:3,moderate:4,hard:5}, Swimming:{light:7,moderate:10,hard:14},
  Walking:{light:3,moderate:4,hard:6}, Other:{light:4,moderate:6,hard:9}
};

export default function Workout() {
  const { date } = useDate();
  const [workouts, setWorkouts] = useState([]);
  const [form, setForm] = useState({ type: 'Running', duration: '', intensity: 'moderate' });

  const load = async () => setWorkouts(await getWorkouts(date));
  useEffect(() => { load(); }, [date]);

  const estBurned = () => (CAL_PER_MIN[form.type]?.[form.intensity] || 6) * (parseInt(form.duration) || 0);

  const logWorkout = async () => {
    if (!form.duration) return;
    await addWorkout({ ...form, duration: +form.duration, caloriesBurned: estBurned(), date });
    setForm({ type: 'Running', duration: '', intensity: 'moderate' });
    load();
  };

  const remove = async (id) => { await deleteWorkout(id); load(); };
  const totalBurned = workouts.reduce((s, w) => s + w.caloriesBurned, 0);

  return (
    <div className="page">
      <h1 className="page-title" style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400}}>Workouts</h1>
      <div className="metric-grid">
        <div className="metric-card"><div className="metric-value" style={{ color: 'var(--warn)' }}>{totalBurned}</div><div className="metric-label">Calories burned</div></div>
        <div className="metric-card"><div className="metric-value">{workouts.length}</div><div className="metric-label">Sessions today</div></div>
      </div>
      <Card>
        <h2 className="card-title">Log workout</h2>
        <div className="form-grid">
          <div className="form-group"><label>Type</label>
            <select className="form-input" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
              {Object.keys(CAL_PER_MIN).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Duration (min)</label>
            <input className="form-input" type="number" placeholder="30" value={form.duration} onChange={e => setForm({...form,duration:e.target.value})} />
          </div>
          <div className="form-group"><label>Intensity</label>
            <select className="form-input" value={form.intensity} onChange={e => setForm({...form,intensity:e.target.value})}>
              <option value="light">Light</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Estimated burn: <strong>{estBurned()} kcal</strong></p>
        <button className="btn-accent" onClick={logWorkout}>Log workout</button>
      </Card>
      <Card>
        <h2 className="card-title">Today's workouts</h2>
        {workouts.length === 0 ? <p className="empty-text">No workouts logged today</p>
          : workouts.map(w => (
            <div key={w.id} className="log-row">
              <div>
                <div style={{ fontWeight: 500 }}>{w.type}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{w.duration} min · {w.intensity}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--warn)' }}>-{w.caloriesBurned} kcal</span>
                <button className="btn-icon" onClick={() => remove(w.id)}>✕</button>
              </div>
            </div>
          ))}
      </Card>
    </div>
  );
}
