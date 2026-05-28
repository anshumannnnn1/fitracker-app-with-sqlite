import React, { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { Card } from '../components/Card';
import { saveProfile } from '../db/database';
import './Pages.css';

const PLANS = {
  'Balanced':             { p:'25%',c:'50%',f:'25%', tip:'Focus on whole grains, lean proteins, healthy fats, and plenty of fruits and vegetables.' },
  'High Protein':         { p:'40%',c:'35%',f:'25%', tip:'Great for muscle building. Include chicken, eggs, lentils, paneer, and Greek yogurt.' },
  'Low Carb':             { p:'35%',c:'25%',f:'40%', tip:'Reduces blood sugar spikes. Focus on proteins, non-starchy vegetables, and healthy fats.' },
  'Keto':                 { p:'25%',c:'5%', f:'70%', tip:'Extremely low carb, very high fat. Focus on avocado, nuts, oils, eggs, and meats.' },
  'Vegan':                { p:'20%',c:'55%',f:'25%', tip:'Get protein from legumes, tofu, tempeh, quinoa, and seeds. Watch B12 and iron levels.' },
  'Vegetarian':           { p:'22%',c:'52%',f:'26%', tip:'Include dairy, eggs, legumes, nuts, and whole grains for complete nutrition.' },
  'Mediterranean':        { p:'20%',c:'50%',f:'30%', tip:'Olive oil, fish, vegetables, legumes, and whole grains — one of the healthiest diets.' },
  'Intermittent Fasting': { p:'30%',c:'40%',f:'30%', tip:'Eat in a time-restricted window (e.g. 16:8). Stay hydrated during fasting hours.' },
};

export default function Diet() {
  const { profile, refreshProfile } = useProfile();
  const [bmi, setBmi] = useState({ weight:'', height:'', age:'', gender:'male', activity:'1.55' });
  const [result, setResult] = useState(null);
  const selected = profile?.dietType || 'Balanced';

  const selectDiet = async (name) => {
    await saveProfile({ ...profile, dietType: name });
    refreshProfile();
  };

  const calcBMR = () => {
    const { weight:w, height:h, age:a, gender:g, activity:act } = bmi;
    if (!w || !h || !a) return;
    const bmr = g === 'male' ? (10*+w)+(6.25*+h)-(5*+a)+5 : (10*+w)+(6.25*+h)-(5*+a)-161;
    const tdee = Math.round(bmr * parseFloat(act));
    const bmiVal = parseFloat((+w/((+h/100)**2)).toFixed(1));
    let bmiLabel = 'Normal weight';
    if (bmiVal < 18.5) bmiLabel = 'Underweight';
    else if (bmiVal > 24.9 && bmiVal <= 29.9) bmiLabel = 'Overweight';
    else if (bmiVal > 29.9) bmiLabel = 'Obese';
    setResult({ bmr: Math.round(bmr), tdee, bmi: bmiVal, bmiLabel, loss: Math.round(tdee*0.8) });
  };

  const plan = PLANS[selected] || PLANS['Balanced'];

  return (
    <div className="page">
      <h1 className="page-title" style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400}}>Diet Planner</h1>
      <Card>
        <h2 className="card-title">Choose your diet type</h2>
        <div className="tag-row">
          {Object.keys(PLANS).map(name => (
            <button key={name} className={`tag ${selected === name ? 'tag-active' : ''}`} onClick={() => selectDiet(name)}>{name}</button>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="card-title">Macro targets — {selected}</h2>
        <div className="macro-row">
          <div className="macro-chip"><div className="macro-val">{plan.p}</div><div>Protein</div></div>
          <div className="macro-chip"><div className="macro-val">{plan.c}</div><div>Carbs</div></div>
          <div className="macro-chip"><div className="macro-val">{plan.f}</div><div>Fats</div></div>
        </div>
        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{plan.tip}</p>
      </Card>
      <Card>
        <h2 className="card-title">BMR / TDEE / BMI calculator</h2>
        <div className="form-grid">
          <div className="form-group"><label>Weight (kg)</label><input className="form-input" type="number" placeholder="70" value={bmi.weight} onChange={e=>setBmi({...bmi,weight:e.target.value})} /></div>
          <div className="form-group"><label>Height (cm)</label><input className="form-input" type="number" placeholder="170" value={bmi.height} onChange={e=>setBmi({...bmi,height:e.target.value})} /></div>
          <div className="form-group"><label>Age</label><input className="form-input" type="number" placeholder="25" value={bmi.age} onChange={e=>setBmi({...bmi,age:e.target.value})} /></div>
          <div className="form-group"><label>Gender</label>
            <select className="form-input" value={bmi.gender} onChange={e=>setBmi({...bmi,gender:e.target.value})}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Activity level</label>
            <select className="form-input" value={bmi.activity} onChange={e=>setBmi({...bmi,activity:e.target.value})}>
              <option value="1.2">Sedentary</option><option value="1.375">Lightly active</option>
              <option value="1.55">Moderately active</option><option value="1.725">Very active</option>
              <option value="1.9">Extra active</option>
            </select>
          </div>
        </div>
        <button className="btn-accent" onClick={calcBMR}>Calculate</button>
        {result && (
          <div className="metric-grid" style={{ marginTop: 16 }}>
            <div className="metric-card"><div className="metric-value" style={{color:'var(--accent)'}}>{result.tdee}</div><div className="metric-label">Daily calories (TDEE)</div></div>
            <div className="metric-card"><div className="metric-value">{result.bmi}</div><div className="metric-label">BMI — {result.bmiLabel}</div></div>
            <div className="metric-card"><div className="metric-value">{result.bmr}</div><div className="metric-label">BMR (base)</div></div>
            <div className="metric-card"><div className="metric-value" style={{color:'var(--warn)'}}>{result.loss}</div><div className="metric-label">For fat loss</div></div>
          </div>
        )}
      </Card>
    </div>
  );
}
