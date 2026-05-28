import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useDate } from '../hooks/useDate';
import { Card, ProgressBar } from '../components/Card';
import { getSteps, addSteps, saveProfile } from '../db/database';
import './Pages.css';

export default function Steps() {
  const { profile, refreshProfile } = useProfile();
  const { date } = useDate();
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [sensorActive, setSensorActive] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [sensorError, setSensorError] = useState('');

  const lastMagnitude = useRef(0);
  const cooldown = useRef(false);
  const dateRef = useRef(date);
  dateRef.current = date;

  const stepGoal = profile?.stepGoal || 10000;

  const load = async () => {
    const res = await getSteps(date);
    setTotal(res.total);
    setLogs(res.logs);
  };

  useEffect(() => { load(); }, [date]);

  const handleMotion = async (event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const x = acc.x || 0, y = acc.y || 0, z = acc.z || 0;
    const magnitude = Math.sqrt(x*x + y*y + z*z);
    const diff = Math.abs(magnitude - lastMagnitude.current);
    if (diff > 6 && !cooldown.current) {
      cooldown.current = true;
      await addSteps(1, dateRef.current);
      setTotal(prev => prev + 1);
      setLogs(prev => [...prev, { count: 1, loggedAt: new Date().toISOString() }]);
      setTimeout(() => { cooldown.current = false; }, 400);
    }
    lastMagnitude.current = magnitude;
  };

  const startSensor = () => { window.addEventListener('devicemotion', handleMotion); setSensorActive(true); setSensorError(''); };
  const stopSensor = () => { window.removeEventListener('devicemotion', handleMotion); setSensorActive(false); };

  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') { setSensorError('Motion sensor not available.'); return; }
    if (typeof DeviceMotionEvent.requestPermission === 'function') { setNeedsPermission(true); return; }
    startSensor();
    return () => stopSensor();
  }, []);

  const requestIOSPermission = async () => {
    try {
      const state = await DeviceMotionEvent.requestPermission();
      if (state === 'granted') { setNeedsPermission(false); startSensor(); }
      else setSensorError('Permission denied. Enable in iOS Settings > Safari > Motion & Orientation Access.');
    } catch (err) { setSensorError('Could not request permission: ' + err.message); }
  };

  const addManualSteps = async () => {
    if (!input || parseInt(input) <= 0) return;
    await addSteps(parseInt(input), date);
    setInput('');
    load();
  };

  const setGoal = async () => {
    if (!goalInput) return;
    await saveProfile({ ...profile, stepGoal: parseInt(goalInput) });
    setGoalInput('');
    refreshProfile();
  };

  const pct = Math.min(Math.round((total / stepGoal) * 100), 100);

  return (
    <div className="page">
      <h1 className="page-title" style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400}}>Step Counter</h1>
      <Card>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--accent)' }}>{total.toLocaleString()}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Goal: {stepGoal.toLocaleString()} steps</div>
        </div>
        <ProgressBar value={total} max={stepGoal} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          <span>0</span><span>{pct}% of goal</span><span>{stepGoal.toLocaleString()}</span>
        </div>
        <div style={{ marginTop: 16, marginBottom: 4 }}>
          {needsPermission && (
            <button className="btn-accent" style={{ width: '100%', marginBottom: 8 }} onClick={requestIOSPermission}>
              📱 Tap to enable motion sensor
            </button>
          )}
          {sensorActive && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-light)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
              <span style={{ color: 'var(--accent-dark)' }}>🟢 Auto step detection active</span>
              <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={stopSensor}>Stop</button>
            </div>
          )}
          {sensorError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--danger)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
              ⚠️ {sensorError}
            </div>
          )}
          {!sensorActive && !needsPermission && !sensorError && (
            <button className="btn-outline" style={{ width: '100%' }} onClick={startSensor}>▶ Start auto step detection</button>
          )}
        </div>
        <div className="input-row" style={{ marginTop: 16 }}>
          <input className="form-input" type="number" placeholder="Add steps manually" value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManualSteps()} />
          <button className="btn-accent" onClick={addManualSteps}>Add</button>
        </div>
        <div className="input-row">
          <input className="form-input" type="number" placeholder="Set daily goal" value={goalInput}
            onChange={e => setGoalInput(e.target.value)} />
          <button className="btn-outline" onClick={setGoal}>Set goal</button>
        </div>
      </Card>
      <Card>
        <h2 className="card-title">Today's log</h2>
        {logs.length === 0 ? <p className="empty-text">No steps logged yet</p>
          : logs.slice(-10).reverse().map((l, i) => (
            <div key={i} className="log-row">
              <span>{new Date(l.loggedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>+{l.count.toLocaleString()} steps</span>
            </div>
          ))}
      </Card>
    </div>
  );
}
