import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useDate } from '../hooks/useDate';
import { Card, ProgressBar } from '../components/Card';
import { getFoods, addFood, deleteFood } from '../db/database';
import './Pages.css';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Calories() {
  const { profile } = useProfile();
  const { date } = useDate();
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState({ name: '', meal: 'Breakfast', calories: '', protein: '', carbs: '', fats: '' });
  const calGoal = profile?.calGoal || 2000;

  const load = async () => setFoods(await getFoods(date));
  useEffect(() => { load(); }, [date]);

  const logFood = async () => {
    if (!form.name || !form.calories) return;
    await addFood({ ...form, calories: +form.calories, protein: +form.protein||0, carbs: +form.carbs||0, fats: +form.fats||0, date });
    setForm({ name: '', meal: 'Breakfast', calories: '', protein: '', carbs: '', fats: '' });
    load();
  };

  const removeFood = async (id) => { await deleteFood(id); load(); };

  const totals = foods.reduce((a, f) => ({ cal: a.cal+f.calories, p: a.p+f.protein, c: a.c+f.carbs, f: a.f+f.fats }), { cal:0, p:0, c:0, f:0 });
  const byMeal = MEALS.map(m => ({ meal: m, items: foods.filter(f => f.meal === m) })).filter(g => g.items.length > 0);

  return (
    <div className="page">
      <h1 className="page-title" style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400}}>Calorie Tracker</h1>
      <div className="metric-grid">
        <div className="metric-card"><div className="metric-value">{totals.cal}</div><div className="metric-label">Eaten / {calGoal}</div></div>
        <div className="metric-card"><div className="metric-value" style={{ color: totals.cal > calGoal ? 'var(--danger)' : 'var(--accent)' }}>{Math.max(calGoal-totals.cal,0)}</div><div className="metric-label">Remaining</div></div>
      </div>
      <ProgressBar value={totals.cal} max={calGoal} />
      <Card>
        <div className="macro-row">
          <div className="macro-chip"><div className="macro-val">{totals.p}g</div><div>Protein</div></div>
          <div className="macro-chip"><div className="macro-val">{totals.c}g</div><div>Carbs</div></div>
          <div className="macro-chip"><div className="macro-val">{totals.f}g</div><div>Fats</div></div>
        </div>
      </Card>
      <Card>
        <h2 className="card-title">Log food</h2>
        <div className="form-grid">
          <div className="form-group"><label>Meal</label>
            <select className="form-input" value={form.meal} onChange={e => setForm({...form,meal:e.target.value})}>
              {MEALS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Food name</label>
            <input className="form-input" placeholder="e.g. Rice, Chicken..." value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
          </div>
          <div className="form-group"><label>Calories (kcal)</label>
            <input className="form-input" type="number" placeholder="0" value={form.calories} onChange={e => setForm({...form,calories:e.target.value})} />
          </div>
          <div className="form-group"><label>Protein (g)</label>
            <input className="form-input" type="number" placeholder="0" value={form.protein} onChange={e => setForm({...form,protein:e.target.value})} />
          </div>
          <div className="form-group"><label>Carbs (g)</label>
            <input className="form-input" type="number" placeholder="0" value={form.carbs} onChange={e => setForm({...form,carbs:e.target.value})} />
          </div>
          <div className="form-group"><label>Fats (g)</label>
            <input className="form-input" type="number" placeholder="0" value={form.fats} onChange={e => setForm({...form,fats:e.target.value})} />
          </div>
        </div>
        <button className="btn-accent" onClick={logFood}>Log food</button>
      </Card>
      {byMeal.map(({ meal, items }) => (
        <Card key={meal}>
          <h2 className="card-title" style={{ color: 'var(--accent)' }}>{meal}</h2>
          {items.map(f => (
            <div key={f.id} className="log-row">
              <div>
                <div style={{ fontWeight: 500 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{f.protein}g P · {f.carbs}g C · {f.fats}g F</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{f.calories} kcal</span>
                <button className="btn-icon" onClick={() => removeFood(f.id)}>✕</button>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
