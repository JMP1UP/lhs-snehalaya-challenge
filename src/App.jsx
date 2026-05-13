import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";
import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "./firebase.js";

const TARGET_KM = 7000;
const STEPS_TO_KM = 0.0008;

const initialEntries = [
  { id: 1, name: "Emily C.", group: "Year 9", house: "Curie", type: "steps", steps: 6500, km: 5.2, date: "2026-05-12" },
  { id: 2, name: "Amelia W.", group: "Year 8", house: "Pankhurst", type: "steps", steps: 7750, km: 6.2, date: "2026-05-12" },
  { id: 3, name: "Mrs Williams", group: "Staff", house: "Staff", type: "km", steps: 0, km: 5.0, date: "2026-05-12" },
  { id: 4, name: "Isla S.", group: "Year 10", house: "Nightingale", type: "km", steps: 0, km: 4.3, date: "2026-05-11" },
  { id: 5, name: "Tara H.", group: "Year 12", house: "Franklin", type: "steps", steps: 5400, km: 4.3, date: "2026-05-11" },
  { id: 6, name: "Ava Patel", group: "Year 7", house: "Pankhurst", type: "steps", steps: 12400, km: 9.9, date: "2026-05-10" },
  { id: 7, name: "Mrs Davies", group: "Staff", house: "Staff", type: "steps", steps: 11200, km: 9.0, date: "2026-05-10" },
  { id: 8, name: "Mr Partridge", group: "Staff", house: "Staff", type: "km", steps: 0, km: 8.8, date: "2026-05-09" },
  { id: 9, name: "Maya Shah", group: "Year 10", house: "Curie", type: "steps", steps: 9500, km: 7.6, date: "2026-05-09" },
  { id: 10, name: "Grace W.", group: "Year 9", house: "Curie", type: "km", steps: 0, km: 2.4, date: "2026-05-08" },
];

const yearGroups = ["Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13", "Staff"];
const houses = ["Pankhurst", "Curie", "Nightingale", "Franklin", "Staff"];
const navItems = ["Dashboard", "Log Activity", "My Progress", "Groups", "Badges", "About Snehalaya", "How It Works"];

function formatKm(value) {
  return Number(value).toLocaleString("en-GB", { maximumFractionDigits: 1 });
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .replace(".", "")
    .slice(0, 2)
    .toUpperCase();
}

function SchoolLogo({ compact = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-white/25">
        <img
          src="/lhs-logo.png"
          alt="Leicester High School for Girls logo"
          className="h-full w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.parentElement.innerHTML = "<span style='font-size:26px'>🔥</span>";
          }}
        />
      </div>
      {!compact && (
        <div className="leading-tight text-white">
          <p className="text-base font-semibold tracking-wide">LEICESTER</p>
          <p className="text-base font-semibold tracking-wide">HIGH</p>
        </div>
      )}
    </div>
  );
}

function IconBox({ children, accent = "blue" }) {
  const styles = {
    blue: "bg-[#00236C] text-white",
    aqua: "bg-[#1CFFE3] text-[#00236C]",
    purple: "bg-[#6D2077] text-white",
    pink: "bg-[#FF2BD6] text-white",
  };
  return <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ${styles[accent]}`}>{children}</div>;
}

function StatCard({ icon, label, value, detail, accent = "blue" }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm">
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <IconBox accent={accent}>{icon}</IconBox>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p>
          <p className="text-xl font-bold text-[#00236C] sm:text-2xl">{value}</p>
          {detail && <p className="text-xs text-slate-500">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Leaderboard({ rows }) {
  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBox>🏆</IconBox>
            <h3 className="text-lg font-bold text-[#00236C]">Teacher leaderboard</h3>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Staff only</span>
        </div>

        <div className="mb-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-center text-xs font-medium text-slate-600">
          <button className="rounded-lg bg-white py-2 text-[#00236C] shadow-sm">Individuals</button>
          <button className="py-2">Year Groups</button>
          <button className="py-2">Houses</button>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.slice(0, 5).map((row, index) => (
            <div key={row.name} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-amber-400 text-white" : index === 1 ? "bg-slate-300 text-white" : index === 2 ? "bg-orange-600 text-white" : "bg-white text-[#00236C]"}`}>{index + 1}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00236C] text-xs font-bold text-white">{initials(row.name)}</span>
                <span className="truncate font-medium text-[#00236C]">{row.name}</span>
              </div>
              <span className="shrink-0 font-bold text-[#00AFC4]">{formatKm(row.total)} km</span>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 w-full border-[#00236C] text-[#00236C] hover:bg-[#EEF4FF]">Review contributors</Button>
      </CardContent>
    </Card>
  );
}

function MobileNav({ view, setView }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 text-xs font-medium">
        <button onClick={() => setView("student")} className={`rounded-2xl px-3 py-2 ${view === "student" ? "bg-[#00236C] text-white" : "text-slate-600"}`}>🏠<br />Home</button>
        <a href="#log" className="rounded-2xl px-3 py-2 text-center text-slate-600">🏃<br />Log</a>
        <button onClick={() => setView("dashboard")} className={`rounded-2xl px-3 py-2 ${view === "dashboard" ? "bg-[#00236C] text-white" : "text-slate-600"}`}>🔒<br />Staff</button>
      </div>
    </div>
  );
}

export default function App() {

  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("student");
  const [form, setForm] = useState({
    name: "",
    group: "Year 7",
    house: "Pankhurst",
    type: "km",
    steps: "",
    km: ""
  });

  useEffect(() => {
    async function loadEntries() {
      const snapshot = await getDocs(collection(db, "entries"));

      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setEntries(loaded);
    }

    loadEntries();
  }, []);

  const totalKm = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.km || 0), 0),
    [entries]
  );

  const progress = Math.min((totalKm / TARGET_KM) * 100, 100);
  const remaining = Math.max(TARGET_KM - totalKm, 0);

  const totalsBy = (key) => Object.entries(entries.reduce((acc, entry) => {
    acc[entry[key]] = (acc[entry[key]] || 0) + Number(entry.km || 0);
    return acc;
  }, {})).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  const individualLeaders = useMemo(() => totalsBy("name"), [entries]);
  const groupLeaders = useMemo(() => totalsBy("group"), [entries]);
  const houseLeaders = useMemo(() => totalsBy("house"), [entries]);
  const unusualEntries = entries.filter((entry) => entry.km > 50);
  const nextMilestone = Math.ceil(totalKm / 500) * 500 || 500;
  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Submit clicked", form);

    const km =
      form.type === "steps"
        ? Number(form.steps || 0) * STEPS_TO_KM
        : Number(form.km || 0);

    if (!form.name.trim() || km <= 0) {
      alert("Please enter a name and a distance greater than 0.");
      return;
    }

    const newEntry = {
      name: form.name.trim(),
      group: form.group,
      house: form.house,
      type: form.type,
      steps: form.type === "steps" ? Number(form.steps || 0) : 0,
      km: Number(km.toFixed(2)),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, "entries"), newEntry);
      setEntries([{ id: docRef.id, ...newEntry }, ...entries]);
      setForm({ ...form, name: "", steps: "", km: "" });
      alert("Activity logged successfully.");
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Could not save activity. Check Firebase config and Firestore rules.");
    }
  }



   

  return (
    <div className="min-h-screen bg-[#F7FAFF] pb-24 text-[#00236C] lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-hidden bg-[#00236C] text-white lg:block">
        <div className="p-8"><SchoolLogo /></div>
        <nav className="space-y-2 px-4">
          {navItems.map((item, index) => (
            <button key={item} onClick={() => item === "Dashboard" ? setView("student") : null} className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-base ${index === 0 ? "bg-white/15 font-semibold" : "hover:bg-white/10"}`}>
              <span>{["🏠", "🏃", "👤", "👥", "🛡️", "♡", "ⓘ"][index]}</span>{item}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-24 left-8 right-8 border-t border-white/20 pt-8 text-xl font-bold leading-tight">
          <p className="text-[#1CFFE3]">TOGETHER,</p>
          <p className="text-[#1CFFE3]">WE CAN GO</p>
          <p className="text-[#FF2BD6]">FURTHER ♡</p>
        </div>
        <div className="absolute -bottom-8 left-0 right-0 h-24 bg-gradient-to-r from-[#1CFFE3] via-[#FF2BD6] to-[#6D2077] opacity-90 blur-sm" />
      </aside>

      <main className="lg:ml-72">
        <header className="px-4 py-5 sm:px-6 lg:px-10">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <SchoolLogo compact />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Leicester High</p>
                <p className="text-sm font-semibold">Snehalaya Challenge</p>
              </div>
            </div>
            <Button variant="outline" className="border-[#00236C] text-[#00236C]">Sign in</Button>
          </div>

          <div className="relative mx-auto max-w-7xl text-center">
            <Button variant="outline" className="hidden border-slate-200 bg-white text-[#00236C] shadow-sm lg:absolute lg:right-0 lg:top-0 lg:flex">▣ Sign in with Microsoft 365</Button>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"><span className="text-[#FF2BD6]">7,000</span> KM CHALLENGE</h1>
            <p className="mt-2 text-2xl italic text-[#FF2BD6] sm:text-3xl">Leicester High to Snehalaya</p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600 sm:text-base">Walking, running and jogging together to make a difference. Every step brings us closer to Snehalaya, India.</p>
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 lg:hidden">
              <a href="#log" className="rounded-2xl bg-[#00236C] px-4 py-3 text-sm font-bold text-white shadow-sm">Log activity</a>
              <button onClick={() => setView("student")} className="rounded-2xl border border-[#00236C] bg-white px-4 py-3 text-sm font-bold text-[#00236C] shadow-sm">My progress</button>
              
            </div>
            <div className="mt-5 hidden items-center justify-between text-xs font-bold uppercase text-[#00236C] md:flex">
              <div className="text-left">📍 Leicester<br />England</div>
              <div className="mx-6 flex-1 border-t-2 border-dashed border-[#00236C]/35" />
              <div className="text-right">Snehalaya 📍<br />India</div>
            </div>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:gap-4 sm:px-6 lg:grid-cols-4 lg:px-10">
          <StatCard icon="🏃" label="Total distance" value={`${formatKm(totalKm)} km`} detail="contributed" accent="blue" />
          <StatCard icon="👣" label="Target" value="7,000 km" detail="our goal" accent="aqua" />
          <StatCard icon="👥" label="Contributors" value={new Set(entries.map((e) => e.name)).size} detail="students & staff" accent="blue" />
          <StatCard icon="★" label="Progress" value={`${progress.toFixed(1)}%`} detail="of our goal" accent="pink" />
        </section>

        {view === "student" ? (
          <section className="mx-auto mt-4 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-10">
            <div className="space-y-4">
              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold uppercase text-[#00236C]">Whole school progress</h2>
                      <p className="mt-3 text-4xl font-extrabold sm:text-5xl">{formatKm(totalKm)} <span className="text-xl">km</span> <span className="text-base font-normal text-slate-500">completed</span></p>
                    </div>
                    <div className="text-right"><p className="text-2xl font-extrabold">7,000 <span className="text-base">km</span></p><p className="text-sm text-slate-500">our target</p></div>
                  </div>
                  <div className="h-9 overflow-hidden rounded-xl bg-slate-200">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(progress, 7)}%` }} transition={{ duration: 0.8 }} className="flex h-full items-center justify-end rounded-xl bg-gradient-to-r from-[#FF2BD6] to-[#6D2077] pr-3 text-sm font-bold text-white">{progress.toFixed(1)}%</motion.div>
                  </div>
                  <div className="mt-4 flex flex-col justify-between gap-2 text-base sm:flex-row">
                    <p><span className="font-bold text-[#00AFC4]">{formatKm(remaining)} km</span> to go</p>
                    <p className="italic text-[#FF2BD6]">Let’s get to Snehalaya! ♡</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <Card id="log" className="rounded-3xl border-slate-200 bg-white shadow-sm xl:order-1">
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-3"><IconBox>🏃</IconBox><h3 className="text-lg font-bold uppercase">Log your activity</h3></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 text-sm font-bold">
                        <button type="button" onClick={() => setForm({ ...form, type: "km" })} className={`rounded-lg py-2 ${form.type === "km" ? "bg-[#00236C] text-white" : "text-slate-500"}`}>KM</button>
                        <button type="button" onClick={() => setForm({ ...form, type: "steps" })} className={`rounded-lg py-2 ${form.type === "steps" ? "bg-[#00236C] text-white" : "text-slate-500"}`}>STEPS</button>
                      </div>

                      <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C]" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>{yearGroups.map((group) => <option key={group}>{group}</option>)}</select>
                        <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C]" value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value })}>{houses.map((house) => <option key={house}>{house}</option>)}</select>
                      </div>
                      {form.type === "steps" ? <input type="number" min="0" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C]" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} placeholder="Steps, e.g. 10000" /> : <input type="number" min="0" step="0.1" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C]" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} placeholder="Kilometres, e.g. 5.0" />}
                      <div className="rounded-2xl bg-[#EFFFFD] p-4 text-center text-sm text-[#00236C]"><p className="font-bold">Steps to km conversion</p><p className="mt-1">10,000 steps ≈ 8 km</p></div>
                      <Button type="submit" className="w-full bg-[#00236C] py-6 text-base font-bold text-white hover:bg-[#001A50]"> Log Activity</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <Card className="hidden rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="mb-5 text-lg font-bold uppercase">Milestone achievements</h3>
                  <div className="grid grid-cols-4 gap-4 text-center text-xs sm:grid-cols-7">
                    {[500, 1000, 2000, 3000, 4500, 5500, 7000].map((m) => {
                      const done = totalKm >= m;
                      return <div key={m} className="space-y-2"><div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 ${done ? "border-[#FF2BD6] bg-[#FF2BD6] text-white" : "border-dashed border-slate-300 bg-white text-[#00236C]"}`}>{done ? "✓" : m === 7000 ? "♡" : "⚑"}</div><p className="font-bold">{m.toLocaleString()} km</p><p className="text-slate-500">{done ? "Achieved" : m === nextMilestone ? "Next target" : "Goal"}</p></div>;
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="hidden space-y-4 lg:block">
              <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                <div className="h-20 bg-[#00236C]"><div className="h-full bg-gradient-to-r from-[#00236C] via-[#6D2077] to-[#FF2BD6] opacity-90" /></div>
                <CardContent className="relative p-5 pt-10">
                  <div className="absolute -top-8 left-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#FF2BD6] text-xl font-bold text-white shadow-sm">EC</div>
                  <h3 className="mt-3 text-2xl font-bold">Emily C.</h3><p>Year 9</p><button className="mt-2 text-sm font-bold text-[#FF2BD6] underline">View profile</button>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5"><h3 className="font-bold uppercase">My progress</h3><p className="mt-4 text-4xl font-extrabold">48.6 <span className="text-lg">km</span></p><p className="text-slate-500">total contributed</p><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-full w-1/4 rounded-full bg-[#FF2BD6]" /></div><div className="mt-5 rounded-2xl bg-[#F7FAFF] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Weekly streak</p><p className="mt-1 text-2xl font-extrabold text-[#00236C]">2 / 3 days</p></div><div className="flex gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF2BD6] text-white">✓</div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D2077] text-white">✓</div><div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400">•</div></div></div><p className="mt-3 text-sm text-slate-600">Log activity on one more day this week to complete your streak.</p></div><div className="mt-4 rounded-2xl bg-[#EFFFFD] p-4 text-center"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Personal target</p><p className="mt-1 text-3xl font-extrabold text-[#00236C]">5 km</p><p className="mt-1 text-sm text-slate-600">Suggested weekly goal</p></div><p className="mt-4 italic text-[#FF2BD6]">Consistency matters more than competition ☆</p></CardContent></Card>
              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5"><div className="mb-3 flex justify-between"><h3 className="font-bold uppercase">Recent activity</h3><button className="text-xs font-bold text-[#FF2BD6] underline">View all</button></div>{entries.slice(0, 4).map((e) => <div key={e.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF2BD6] text-xs font-bold text-white">{initials(e.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{e.name}</p><p className="text-xs text-slate-500">Logged {formatKm(e.km)} km</p></div></div>)}</CardContent></Card>
              <Card className="rounded-3xl border-0 bg-[#00236C] text-white shadow-sm"><CardContent className="p-6"><h3 className="font-bold uppercase">Next milestone</h3><p className="mt-5 text-4xl font-extrabold">{nextMilestone.toLocaleString()} <span className="text-lg">km</span></p><p className="mt-2">Only {formatKm(nextMilestone - totalKm)} km to go!</p></CardContent></Card>
            </aside>
          </section>
        ) : (
          <section className="mx-auto mt-4 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-10">
            <div className="grid gap-4 lg:grid-cols-3"><Leaderboard rows={individualLeaders} /><Leaderboard rows={groupLeaders} /><Leaderboard rows={houseLeaders} /></div>
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><h3 className="text-xl font-bold">Teacher dashboard</h3><Button variant="outline" className="border-[#00236C] text-[#00236C]">Export CSV</Button></div><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Group</th><th className="px-4 py-3">House</th><th className="px-4 py-3">Entry</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.id}><td className="px-4 py-3 font-medium">{entry.name}</td><td className="px-4 py-3">{entry.group}</td><td className="px-4 py-3">{entry.house}</td><td className="px-4 py-3">{formatKm(entry.km)} km</td><td className="px-4 py-3">{entry.date}</td></tr>)}</tbody></table></div><div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Moderation check</p><p>{unusualEntries.length === 0 ? "No unusual entries currently flagged." : `${unusualEntries.length} entries are over 50 km and should be checked.`}</p></div></CardContent></Card>
          </section>
        )}
      </main>
      <footer className="hidden bg-[#00236C] px-10 py-5 text-sm font-semibold text-white lg:ml-72 lg:flex lg:items-center lg:justify-between"><span>LEICESTER HIGH SCHOOL</span><span>Together we can go further</span><span>#LHMovesForSnehalaya ♡</span></footer>
      <MobileNav view={view} setView={setView} />
    </div>
  );
}
