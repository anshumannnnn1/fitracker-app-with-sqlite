import React, { useEffect, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useDate } from '../hooks/useDate';
import { Card, MetricCard, ProgressBar } from '../components/Card';
import { getSteps, getWeeklySteps, getFoods, getWater, getWorkouts } from '../db/database';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Pages.css';

export default function Dashboard() {
  const { profile } = useProfile();
  const { date } = useDate();
  const [data, setData] = useState({ steps: 0, calories: 0, water: 0, burned: 0, weekly: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [stepsRes, foods, waterRes, workouts] = await Promise.all([
          getSteps(date),
          getFoods(date),
          getWater(date),
          getWorkouts(date),
        ]);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekly = await getWeeklySteps(weekStart.toISOString().split('T')[0]);
        setData({
          steps: stepsRes.total,
          calories: foods.reduce((s, f) => s + f.calories, 0),
          water: waterRes.cups || 0,
          burned: workouts.reduce((s, w) => s + w.caloriesBurned, 0),
          weekly
        });
      } catch (err) { console.error(err); }
    };
    load();
  }, [date]);

  const stepGoal = profile?.stepGoal || 10000;
  const calGoal = profile?.calGoal || 2000;
  const waterGoal = profile?.waterGoal || 8;
  const overall = Math.round(((data.steps / stepGoal) + (data.water / waterGoal)) * 50);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="page">
      <h1 className="page-title" style={{fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400}}>
        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.name?.split(' ')[0] || 'there'} 👋
      </h1>

      <div className="metric-grid">
        <MetricCard value={data.steps.toLocaleString()} label="Steps today" sub={`Goal: ${stepGoal.toLocaleString()}`} color="var(--accent)" />
        <MetricCard value={data.calories} label="Calories eaten" sub={`Goal: ${calGoal} kcal`} />
        <MetricCard value={`${data.water} cups`} label="Water today" sub={`Goal: ${waterGoal} cups`} color="#3B82F6" />
        <MetricCard value={data.burned} label="Calories burned" color="var(--warn)" />
      </div>

      <Card>
        <h2 className="card-title">Daily goal ring — {overall}%</h2>
        <div className="ring-container">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="58" fill="none" stroke="#E5E7EB" strokeWidth="12" />
            <circle cx="70" cy="70" r="58" fill="none" stroke="var(--accent)" strokeWidth="12"
              strokeDasharray="364" strokeDashoffset={364 - (364 * Math.min(overall, 100) / 100)}
              strokeLinecap="round" transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset .6s ease' }} />
          </svg>
          <div className="ring-center-text">
            <div style={{ fontSize: 24, fontWeight: 600 }}>{overall}%</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>of goal</div>
          </div>
        </div>
        <div className="progress-labels">
          <div className="progress-item"><span>Steps</span><ProgressBar value={data.steps} max={stepGoal} /><span className="pct-label">{Math.min(Math.round((data.steps/stepGoal)*100),100)}%</span></div>
          <div className="progress-item"><span>Calories</span><ProgressBar value={data.calories} max={calGoal} /><span className="pct-label">{Math.min(Math.round((data.calories/calGoal)*100),100)}%</span></div>
          <div className="progress-item"><span>Water</span><ProgressBar value={data.water} max={waterGoal} color="#3B82F6" /><span className="pct-label">{Math.min(Math.round((data.water/waterGoal)*100),100)}%</span></div>
        </div>
      </Card>

      <Card>
        <h2 className="card-title">Weekly steps</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.weekly.map((d, i) => ({ day: weekDays[i] || d.date, steps: d.total }))}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={v => [v.toLocaleString(), 'Steps']} />
            <Bar dataKey="steps" radius={[6, 6, 0, 0]}>
              {data.weekly.map((_, i) => <Cell key={i} fill={i === 6 ? 'var(--accent)' : '#E5E7EB'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
