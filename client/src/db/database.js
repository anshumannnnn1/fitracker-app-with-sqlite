import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db = null;

export async function initDB() {
  if (db) return db;

  // Web fallback — use localStorage mock
  if (!Capacitor.isNativePlatform()) {
    db = createWebFallback();
    return db;
  }

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection('fittrack', false)).result;
  if (isConn) {
    db = await sqlite.retrieveConnection('fittrack', false);
  } else {
    db = await sqlite.createConnection('fittrack', false, 'no-encryption', 1, false);
  }

  await db.open();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'User',
      age INTEGER DEFAULT 0,
      weight REAL DEFAULT 0,
      height REAL DEFAULT 0,
      gender TEXT DEFAULT 'male',
      stepGoal INTEGER DEFAULT 10000,
      calGoal INTEGER DEFAULT 2000,
      waterGoal INTEGER DEFAULT 8,
      dietType TEXT DEFAULT 'Balanced'
    );

    CREATE TABLE IF NOT EXISTS steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      count INTEGER NOT NULL,
      date TEXT NOT NULL,
      loggedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS water (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cups INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS food (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      meal TEXT DEFAULT 'Breakfast',
      calories INTEGER DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fats REAL DEFAULT 0,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      intensity TEXT DEFAULT 'moderate',
      caloriesBurned INTEGER DEFAULT 0,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT,
      title TEXT NOT NULL,
      detail TEXT,
      type TEXT DEFAULT 'workout',
      date TEXT NOT NULL
    );

    INSERT OR IGNORE INTO profile (id) VALUES (1);
  `);

  return db;
}

// ─── PROFILE ────────────────────────────────────────────────
export async function getProfile() {
  const db = await initDB();
  const res = await db.query('SELECT * FROM profile WHERE id = 1');
  return res.values?.[0] || {};
}

export async function saveProfile(data) {
  const db = await initDB();
  const { name, age, weight, height, gender, stepGoal, calGoal, waterGoal, dietType } = data;
  await db.run(
    `UPDATE profile SET name=?, age=?, weight=?, height=?, gender=?, stepGoal=?, calGoal=?, waterGoal=?, dietType=? WHERE id=1`,
    [name, age, weight, height, gender, stepGoal, calGoal, waterGoal, dietType]
  );
}

// ─── STEPS ──────────────────────────────────────────────────
export async function getSteps(date) {
  const db = await initDB();
  const res = await db.query('SELECT * FROM steps WHERE date = ?', [date]);
  const logs = res.values || [];
  const total = logs.reduce((s, r) => s + r.count, 0);
  return { total, logs };
}

export async function getWeeklySteps(startDate) {
  const db = await initDB();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  return Promise.all(dates.map(async date => {
    const res = await db.query('SELECT SUM(count) as total FROM steps WHERE date = ?', [date]);
    return { date, total: res.values?.[0]?.total || 0 };
  }));
}

export async function addSteps(count, date) {
  const db = await initDB();
  await db.run('INSERT INTO steps (count, date) VALUES (?, ?)', [count, date]);
}

// ─── WATER ──────────────────────────────────────────────────
export async function getWater(date) {
  const db = await initDB();
  const res = await db.query('SELECT * FROM water WHERE date = ?', [date]);
  return res.values?.[0] || { cups: 0 };
}

export async function setWater(cups, date) {
  const db = await initDB();
  await db.run(
    'INSERT INTO water (cups, date) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET cups=?',
    [cups, date, cups]
  );
}

// ─── FOOD / CALORIES ────────────────────────────────────────
export async function getFoods(date) {
  const db = await initDB();
  const res = await db.query('SELECT * FROM food WHERE date = ?', [date]);
  return res.values || [];
}

export async function addFood(data) {
  const db = await initDB();
  const { name, meal, calories, protein, carbs, fats, date } = data;
  const res = await db.run(
    'INSERT INTO food (name, meal, calories, protein, carbs, fats, date) VALUES (?,?,?,?,?,?,?)',
    [name, meal, calories, protein, carbs, fats, date]
  );
  return res.changes?.lastId;
}

export async function deleteFood(id) {
  const db = await initDB();
  await db.run('DELETE FROM food WHERE id = ?', [id]);
}

// ─── WORKOUTS ───────────────────────────────────────────────
export async function getWorkouts(date) {
  const db = await initDB();
  const res = await db.query('SELECT * FROM workouts WHERE date = ?', [date]);
  return res.values || [];
}

export async function addWorkout(data) {
  const db = await initDB();
  const { type, duration, intensity, caloriesBurned, date } = data;
  const res = await db.run(
    'INSERT INTO workouts (type, duration, intensity, caloriesBurned, date) VALUES (?,?,?,?,?)',
    [type, duration, intensity, caloriesBurned, date]
  );
  return res.changes?.lastId;
}

export async function deleteWorkout(id) {
  const db = await initDB();
  await db.run('DELETE FROM workouts WHERE id = ?', [id]);
}

// ─── SCHEDULE ───────────────────────────────────────────────
export async function getSchedule(date) {
  const db = await initDB();
  const res = await db.query('SELECT * FROM schedule WHERE date = ? ORDER BY time ASC', [date]);
  return res.values || [];
}

export async function addSchedule(data) {
  const db = await initDB();
  const { time, title, detail, type, date } = data;
  const res = await db.run(
    'INSERT INTO schedule (time, title, detail, type, date) VALUES (?,?,?,?,?)',
    [time, title, detail, type, date]
  );
  return res.changes?.lastId;
}

export async function deleteSchedule(id) {
  const db = await initDB();
  await db.run('DELETE FROM schedule WHERE id = ?', [id]);
}

// ─── WEB FALLBACK (browser dev only) ────────────────────────
function createWebFallback() {
  const store = (key, val) => { if (val !== undefined) localStorage.setItem(key, JSON.stringify(val)); return JSON.parse(localStorage.getItem(key) || 'null'); };

  return {
    query: async (sql, params = []) => {
      if (sql.includes('FROM profile')) return { values: [store('profile') || { id:1, name:'User', age:0, weight:0, height:0, gender:'male', stepGoal:10000, calGoal:2000, waterGoal:8, dietType:'Balanced' }] };
      if (sql.includes('FROM steps')) {
        const date = params[0]; const all = store('steps') || [];
        if (sql.includes('SUM')) { const total = all.filter(s=>s.date===date).reduce((s,r)=>s+r.count,0); return { values:[{total}] }; }
        return { values: all.filter(s => s.date === date) };
      }
      if (sql.includes('FROM water')) { const all = store('water') || []; return { values: all.filter(w=>w.date===params[0]) }; }
      if (sql.includes('FROM food')) { const all = store('food') || []; return { values: all.filter(f=>f.date===params[0]) }; }
      if (sql.includes('FROM workouts')) { const all = store('workouts') || []; return { values: all.filter(w=>w.date===params[0]) }; }
      if (sql.includes('FROM schedule')) { const all = store('schedule') || []; return { values: all.filter(s=>s.date===params[0]) }; }
      return { values: [] };
    },
    run: async (sql, params = []) => {
      if (sql.includes('UPDATE profile')) {
        const [name,age,weight,height,gender,stepGoal,calGoal,waterGoal,dietType] = params;
        store('profile', {id:1,name,age,weight,height,gender,stepGoal,calGoal,waterGoal,dietType});
      }
      if (sql.includes('INSERT INTO steps')) { const all = store('steps')||[]; const id=Date.now(); all.push({id,count:params[0],date:params[1],loggedAt:new Date().toISOString()}); store('steps',all); return {changes:{lastId:id}}; }
      if (sql.includes('INSERT INTO water')) { const all=(store('water')||[]).filter(w=>w.date!==params[1]); all.push({id:Date.now(),cups:params[0],date:params[1]}); store('water',all); }
      if (sql.includes('INSERT INTO food')) { const all=store('food')||[]; const id=Date.now(); all.push({id,...Object.fromEntries(['name','meal','calories','protein','carbs','fats','date'].map((k,i)=>[k,params[i]]))}); store('food',all); return {changes:{lastId:id}}; }
      if (sql.includes('INSERT INTO workouts')) { const all=store('workouts')||[]; const id=Date.now(); all.push({id,...Object.fromEntries(['type','duration','intensity','caloriesBurned','date'].map((k,i)=>[k,params[i]]))}); store('workouts',all); return {changes:{lastId:id}}; }
      if (sql.includes('INSERT INTO schedule')) { const all=store('schedule')||[]; const id=Date.now(); all.push({id,...Object.fromEntries(['time','title','detail','type','date'].map((k,i)=>[k,params[i]]))}); store('schedule',all); return {changes:{lastId:id}}; }
      if (sql.includes('DELETE FROM food')) { store('food',(store('food')||[]).filter(f=>f.id!==params[0])); }
      if (sql.includes('DELETE FROM workouts')) { store('workouts',(store('workouts')||[]).filter(w=>w.id!==params[0])); }
      if (sql.includes('DELETE FROM schedule')) { store('schedule',(store('schedule')||[]).filter(s=>s.id!==params[0])); }
      return { changes: {} };
    },
    execute: async () => {},
    open: async () => {},
  };
}
