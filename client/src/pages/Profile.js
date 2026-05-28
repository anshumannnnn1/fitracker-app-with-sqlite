import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { Card } from '../components/Card';
import { saveProfile } from '../db/database';
import './Pages.css';

export default function Profile() {
  const { profile, refreshProfile } = useProfile();
  const [form, setForm] = useState({ name:'', age:'', weight:'', height:'', gender:'male', stepGoal:'', calGoal:'', waterGoal:'' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      name: profile.name || '',
      age: profile.age || '',
      weight: profile.weight || '',
      height: profile.height || '',
      gender: profile.gender || 'male',
      stepGoal: profile.stepGoal || 10000,
      calGoal: profile.calGoal || 2000,
      waterGoal: profile.waterGoal || 8,
    });
  }, [profile]);

  const save = async () => {
    await saveProfile({ ...profile, ...form });
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bmi = form.weight && form.height
    ? parseFloat((+form.weight / ((+form.height/100)**2)).toFixed(1))
    : null;

  return (
    <div className="page">
      <h1 className="page-title" style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400}}>Profile & Settings</h1>
      <Card>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
            {form.name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div style={{ fontWeight:600, fontSize:18 }}>{form.name || 'Your Name'}</div>
        </div>
        <h2 className="card-title">Personal info</h2>
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Full name</label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          </div>
          <div className="form-group"><label>Age</label>
            <input className="form-input" type="number" value={form.age} onChange={e=>setForm({...form,age:+e.target.value})} />
          </div>
          <div className="form-group"><label>Gender</label>
            <select className="form-input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </div>
          <div className="form-group"><label>Weight (kg)</label>
            <input className="form-input" type="number" value={form.weight} onChange={e=>setForm({...form,weight:+e.target.value})} />
          </div>
          <div className="form-group"><label>Height (cm)</label>
            <input className="form-input" type="number" value={form.height} onChange={e=>setForm({...form,height:+e.target.value})} />
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="card-title">Goals</h2>
        <div className="form-grid">
          <div className="form-group"><label>Daily steps goal</label>
            <input className="form-input" type="number" value={form.stepGoal} onChange={e=>setForm({...form,stepGoal:+e.target.value})} />
          </div>
          <div className="form-group"><label>Calorie goal (kcal)</label>
            <input className="form-input" type="number" value={form.calGoal} onChange={e=>setForm({...form,calGoal:+e.target.value})} />
          </div>
          <div className="form-group"><label>Water goal (cups)</label>
            <input className="form-input" type="number" value={form.waterGoal} onChange={e=>setForm({...form,waterGoal:+e.target.value})} />
          </div>
        </div>
        <button className="btn-accent" onClick={save}>{saved ? '✓ Saved!' : 'Save profile'}</button>
      </Card>
      {bmi && (
        <Card>
          <h2 className="card-title">Your stats</h2>
          <div className="log-row"><span>BMI</span><span style={{fontWeight:600}}>{bmi} — {bmi<18.5?'Underweight':bmi<=24.9?'Normal':bmi<=29.9?'Overweight':'Obese'}</span></div>
          <div className="log-row"><span>Weight</span><span style={{fontWeight:600}}>{form.weight} kg</span></div>
          <div className="log-row"><span>Height</span><span style={{fontWeight:600}}>{form.height} cm</span></div>
        </Card>
      )}

      <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 24, paddingBottom: 8 }}>
        Made with ❤️ by Anshuman 
      </p>

    </div>
  );
}