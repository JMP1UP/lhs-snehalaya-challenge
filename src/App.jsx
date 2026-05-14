import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { db } from "./firebase.js";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";

const TARGET_KM = 7000;
const STEPS_TO_KM = 0.0008;
const yearGroups = [
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "Year 13",
  "Staff",
];

const studentHouses = ["Beaumanor", "Bradgate", "Charnwood"];
const staffHouses = ["Beaumanor", "Bradgate", "Charnwood", "None"];
const houses = [...studentHouses, "Staff", "None"];

const navItems = [
  "Dashboard",
  "Log Activity",
  "Profile",
  "My Progress",
  "Badges",
  "About Snehalaya",
  "How It Works",
];

function formatKm(value) {
  return Number(value || 0).toLocaleString("en-GB", {
    maximumFractionDigits: 1,
  });
}

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .replace(".", "")
    .slice(0, 2)
    .toUpperCase();
}

function displayNameWithoutStaffTag(name = "") {
  return name.replace(/\s*\(staff\)\s*/i, "").trim();
}

function firstNameFromDisplayName(name = "") {
  const cleaned = displayNameWithoutStaffTag(name);
  return cleaned.split(" ")[0] || cleaned;
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
            event.currentTarget.parentElement.innerHTML =
              "<span style='font-size:26px'>🔥</span>";
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

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ${styles[accent]}`}
    >
      {children}
    </div>
  );
}
function PublicSplashScreen({
  totalKm,
  progress,
  remaining,
  handleMicrosoftLogin,
}) {
  return (
    <div className="min-h-screen bg-[#F7FAFF] text-[#00236C]">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-10">
        <div className="rounded-[2rem] bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 sm:p-10">
          <h1 className="text-5xl font-black sm:text-7xl">
            <span className="text-[#FF2BD6]">7,000</span> KM CHALLENGE
          </h1>

          <p className="mt-3 text-2xl italic text-[#FF2BD6]">
            Leicester High to Snehalaya
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600">
            Students and staff are walking, running and jogging together to
            make a difference. Every step brings us closer to Snehalaya, India.
          </p>

          <div className="mt-10 rounded-3xl bg-[#F7FAFF] p-6 text-left">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-slate-500">
                  Whole-school progress
                </p>

                <p className="mt-2 text-5xl font-extrabold">
                  {totalKm.toFixed(1)} km
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-extrabold text-[#FF2BD6]">
                  {progress.toFixed(1)}%
                </p>

                <p className="text-sm text-slate-500">of target</p>
              </div>
            </div>

            <div className="mt-5 h-5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF2BD6] to-[#6D2077]"
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between text-sm">
              <span className="font-bold text-[#00AFC4]">
                {remaining.toFixed(1)} km to go
              </span>

              <span className="text-slate-500">
                Target 7,000 km
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="mt-8 w-full rounded-2xl bg-[#00236C] px-5 py-4 text-base font-bold text-white shadow-sm hover:bg-[#001A50]"
          >
            Sign in with Microsoft 365
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Sign in is required to log activity and view personal progress.
          </p>
        </div>
      </main>
    </div>
  );
}
function StatCard({ icon, label, value, detail, accent = "blue" }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm">
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <IconBox accent={accent}>{icon}</IconBox>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p>
          <p className="text-xl font-bold text-[#00236C] sm:text-2xl">
            {value}
          </p>
          {detail && <p className="text-xs text-slate-500">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherLeaderboard({ rows, title }) {
  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconBox>🏆</IconBox>
            <h3 className="text-lg font-bold text-[#00236C]">{title}</h3>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Staff only
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.slice(0, 5).map((row, index) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? "bg-amber-400 text-white"
                      : index === 1
                      ? "bg-slate-300 text-white"
                      : index === 2
                      ? "bg-orange-600 text-white"
                      : "bg-white text-[#00236C]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00236C] text-xs font-bold text-white">
                  {initials(row.name)}
                </span>
                <span className="truncate font-medium text-[#00236C]">
                  {row.name}
                </span>
              </div>
              <span className="shrink-0 font-bold text-[#00AFC4]">
                {formatKm(row.total)} km
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MobileNav({ view, setView, scrollToLogForm }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 text-xs font-medium">
        <button
          onClick={() => setView("student")}
          className={`rounded-2xl px-3 py-2 ${
            view === "student" ? "bg-[#00236C] text-white" : "text-slate-600"
          }`}
        >
          🏠
          <br />
          Home
        </button>
        <button type="button" onClick={scrollToLogForm} className="rounded-2xl px-3 py-2 text-center text-slate-600">
          🏃
          <br />
          Log
        </button>
        <button
          onClick={() => setView("staff")}
          className={`rounded-2xl px-3 py-2 ${
            view === "staff" ? "bg-[#00236C] text-white" : "text-slate-600"
          }`}
        >
          🔒
          <br />
          Staff
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("student");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [highlightLogForm, setHighlightLogForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    group: "Year 7",
    house: "Beaumanor",
    type: "km",
    logMode: "personal",
    classYearGroup: "Year 3",
    steps: "",
    km: "",
  });

  const { instance, accounts } = useMsal();

  const account = accounts[0];
  const rawAccountName = account?.name || "";
  const cleanDisplayName = displayNameWithoutStaffTag(rawAccountName);
  const firstName = firstNameFromDisplayName(rawAccountName);
  const isStaff = rawAccountName.toLowerCase().includes("(staff)");

  const [profile, setProfile] = useState({
    yearGroup: "Year 7",
    house: "Beaumanor",
    personalTargetKm: 5,
    profileComplete: false,
  });

  useEffect(() => {
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [accounts, instance]);

  useEffect(() => {
    async function loadUserProfile() {
      if (!account) return;

      const userRef = doc(db, "users", account.localAccountId);
      const snapshot = await getDoc(userRef);

      const loadedProfile = snapshot.exists()
        ? snapshot.data()
        : {
            yearGroup: isStaff ? "Staff" : "Year 7",
            house: isStaff ? "Staff" : "Beaumanor",
            profileComplete: isStaff,
          };

      setProfile(loadedProfile);

      setForm((previous) => ({
        ...previous,
        name: cleanDisplayName,
        group: isStaff ? "Staff" : loadedProfile.yearGroup || previous.group,
        house: isStaff ? loadedProfile.house || "None" : loadedProfile.house || previous.house,
      }));
    }

    loadUserProfile();
  }, [account, cleanDisplayName, isStaff]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const snapshot = await getDocs(collection(db, "entries"));

        const loaded = snapshot.docs.map((entryDoc) => ({
          id: entryDoc.id,
          ...entryDoc.data(),
        }));

        setEntries(loaded);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEntries();
  }, []);

  async function handleSaveProfile() {
    if (!account) {
      alert("Please sign in first.");
      return;
    }

    const profileToSave = {
      displayName: cleanDisplayName,
      email: account.username || "",
      yearGroup: isStaff ? "Staff" : profile.yearGroup,
      house: isStaff ? profile.house || "None" : profile.house,
      personalTargetKm: Number(profile.personalTargetKm || 5),
      isStaff,
      profileComplete: true,
      updatedAt: new Date(),
    };

    try {
      await setDoc(doc(db, "users", account.localAccountId), profileToSave, {
        merge: true,
      });

      setProfile(profileToSave);
      setForm((previous) => ({
        ...previous,
        name: cleanDisplayName,
        group: profileToSave.yearGroup,
        house: profileToSave.house,
      }));

      alert("Profile saved.");
      setIsEditingTarget(false);
      setView("student");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Could not save profile. Check the console.");
    }
  }

  function handleMicrosoftLogin() {
    instance.loginRedirect(loginRequest);
  }

  function handleMicrosoftLogout() {
    instance.logoutRedirect();
  }

  function scrollToLogForm() {
    setView("student");
    setHighlightLogForm(true);

    setTimeout(() => {
      document.getElementById("log-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    setTimeout(() => {
      setHighlightLogForm(false);
    }, 1800);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const km =
      form.type === "steps"
        ? Number(form.steps || 0) * STEPS_TO_KM
        : Number(form.km || 0);

    if (account && !isStaff && !profile.profileComplete) {
      alert("Please complete your profile first.");
      setView("profile");
      return;
    }

    if (!form.name.trim() || km <= 0) {
      alert("Please enter a name and a distance greater than 0.");
      return;
    }

    const isClassTotal = isStaff && form.logMode === "classTotal";

    const newEntry = {
      name: isClassTotal
        ? `${form.classYearGroup} class combined total`
        : cleanDisplayName || form.name.trim(),
      group: isClassTotal
        ? form.classYearGroup
        : isStaff
        ? "Staff"
        : profile.yearGroup,
      house: isClassTotal
        ? "Class total - no house"
        : isStaff
        ? profile.house || "None"
        : profile.house,
      type: form.type,
      entryMode: isClassTotal ? "classTotal" : "personal",
      steps: form.type === "steps" ? Number(form.steps || 0) : 0,
      km: Number(km.toFixed(2)),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      userId: account?.localAccountId || "anonymous",
      email: account?.username || "",
      loggedBy: cleanDisplayName || form.name.trim(),
    };

    try {
      const docRef = await addDoc(collection(db, "entries"), newEntry);
      setEntries([{ id: docRef.id, ...newEntry }, ...entries]);
      setForm((previous) => ({ ...previous, steps: "", km: "" }));
      alert("Activity logged successfully.");
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Could not save activity. Check the browser console.");
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!confirm("Delete this entry?")) return;

    try {
      await deleteDoc(doc(db, "entries", entryId));
      setEntries(entries.filter((entry) => entry.id !== entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Could not delete entry. Check the browser console.");
    }
  }

  const totalKm = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.km || 0), 0),
    [entries]
  );

  const progress = Math.min((totalKm / TARGET_KM) * 100, 100);
  const remaining = Math.max(TARGET_KM - totalKm, 0);
const totalsBy = (key) =>
    Object.entries(
      entries.reduce((acc, entry) => {
        const value = entry[key] || "Unknown";

        if (
          key === "house" &&
          (!studentHouses.includes(value) || entry.entryMode === "classTotal")
        ) {
          return acc;
        }

        acc[value] = (acc[value] || 0) + Number(entry.km || 0);
        return acc;
      }, {})
    )
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

  const individualLeaders = useMemo(() => totalsBy("name"), [entries]);
  const groupLeaders = useMemo(() => totalsBy("group"), [entries]);
  const houseLeaders = useMemo(() => totalsBy("house"), [entries]);
  const unusualEntries = entries.filter((entry) => Number(entry.km || 0) > 50);
  const nextMilestone = Math.ceil(totalKm / 500) * 500 || 500;
  const contributorCount = new Set(entries.map((entry) => entry.name)).size;

  const myEntries = account
    ? entries.filter((entry) => entry.userId === account.localAccountId)
    : entries.filter(
        (entry) =>
          form.name.trim() &&
          entry.name.toLowerCase() === form.name.trim().toLowerCase()
      );

  const myTotalKm = myEntries.reduce(
    (sum, entry) => sum + Number(entry.km || 0),
    0
  );

  const personalTargetKm = Number(profile.personalTargetKm || 5);
  const personalProgress = personalTargetKm > 0
    ? Math.min((myTotalKm / personalTargetKm) * 100, 100)
    : 0;
  const personalRemaining = Math.max(personalTargetKm - myTotalKm, 0);

    if (!account) {
    return (
      <PublicSplashScreen
        totalKm={totalKm}
        progress={progress}
        remaining={remaining}
        handleMicrosoftLogin={handleMicrosoftLogin}
      />
    );
  }

return (
    <div className="min-h-screen bg-[#F7FAFF] pb-24 text-[#00236C] lg:pb-0">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-hidden bg-[#00236C] text-white lg:block">
        <div className="p-8">
          <SchoolLogo />
        </div>

        <nav className="space-y-2 px-4">
          {navItems.map((item, index) => (
            <button
              key={item}
              onClick={() => {
                if (item === "Dashboard" || item === "My Progress") setView("student");
                if (item === "Profile") setView("profile");
                if (item === "Log Activity") {
                  scrollToLogForm();
                }
              }}
              className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-base ${
                index === 0 ? "bg-white/15 font-semibold" : "hover:bg-white/10"
              }`}
            >
              <span>{["🏠", "🏃", "👤", "📈", "🛡️", "♡", "ⓘ"][index]}</span>
              {item}
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
        <header className="px-4 py-3 sm:px-6 sm:py-5 lg:px-10">
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <SchoolLogo compact />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Leicester High
                </p>
                <p className="text-sm font-semibold">Snehalaya Challenge</p>
              </div>
            </div>

            {account ? (
              <Button
                onClick={handleMicrosoftLogout}
                className="rounded-xl border border-[#00236C] bg-white px-3 py-2 text-xs font-bold text-[#00236C]"
              >
                Sign out
              </Button>
            ) : (
              <Button
                onClick={handleMicrosoftLogin}
                className="rounded-xl border border-[#00236C] bg-white px-3 py-2 text-xs font-bold text-[#00236C]"
              >
                Sign in
              </Button>
            )}
          </div>

          <div className="relative mx-auto max-w-7xl text-center">
            {account ? (
              <Button
                onClick={handleMicrosoftLogout}
                className="hidden border-slate-200 bg-white px-4 py-2 text-[#00236C] shadow-sm lg:absolute lg:right-0 lg:top-0 lg:flex"
              >
                {account.name} · Sign out
              </Button>
            ) : (
              <Button
                onClick={handleMicrosoftLogin}
                className="hidden border-slate-200 bg-white px-4 py-2 text-[#00236C] shadow-sm lg:absolute lg:right-0 lg:top-0 lg:flex"
              >
                Sign in with Microsoft 365
              </Button>
            )}

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-[#FF2BD6]">7,000</span> KM CHALLENGE
            </h1>
            <p className="mt-1 text-xl italic text-[#FF2BD6] sm:text-3xl">
              Leicester High to Snehalaya
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Walking, running and jogging together to make a difference. Every
              step brings us closer to Snehalaya, India.
            </p>

            <div className="mx-auto mt-4 max-w-sm lg:hidden">
              <a
                href="#log"
                className="block rounded-2xl bg-[#00236C] px-5 py-3 text-center text-sm font-bold text-white shadow-sm"
              >
                Log activity
              </a>
            </div>

            <div className="mt-5 hidden items-center justify-between text-xs font-bold uppercase text-[#00236C] md:flex">
              <div className="text-left">
                📍 Leicester
                <br />
                England
              </div>
              <div className="mx-6 flex-1 border-t-2 border-dashed border-[#00236C]/35" />
              <div className="text-right">
                Snehalaya 📍
                <br />
                India
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto px-4 sm:hidden">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    School progress
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-[#00236C]">
                    {formatKm(totalKm)} <span className="text-base">km</span>
                  </p>
                  <p className="text-sm text-slate-500">completed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-[#FF2BD6]">
                    {progress.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">of goal</p>
                </div>
              </div>

              <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF2BD6] to-[#6D2077]"
                  style={{ width: `${Math.max(progress, 7)}%` }}
                />
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="font-bold text-[#00AFC4]">
                  {formatKm(remaining)} km to go
                </span>
                <span className="text-slate-500">Target 7,000 km</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {account && (
          <section className="mx-auto mt-3 px-4 sm:hidden">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      My sponsored target
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-[#00236C]">
                      {formatKm(myTotalKm)} <span className="text-base">km</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      of {formatKm(personalTargetKm)} km
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingTarget(!isEditingTarget)}
                    className="rounded-xl border border-[#00236C] px-3 py-2 text-xs font-bold text-[#00236C]"
                  >
                    {isEditingTarget ? "Close" : "Edit target"}
                  </button>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#FF2BD6]"
                    style={{ width: `${personalProgress}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {personalRemaining > 0
                    ? `${formatKm(personalRemaining)} km remaining`
                    : "You have reached your personal target!"}
                </p>

                {isEditingTarget && (
                  <div className="mt-4 rounded-2xl border border-[#1CFFE3]/40 bg-[#EFFFFD] p-4">
                    <label className="mb-1 block text-sm font-bold text-[#00236C]">
                      Set your sponsored target
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={profile.personalTargetKm || 5}
                        onChange={(e) =>
                          setProfile((previous) => ({
                            ...previous,
                            personalTargetKm: e.target.value,
                          }))
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C]"
                        placeholder="e.g. 25"
                      />
                      <Button
                        type="button"
                        onClick={handleSaveProfile}
                        className="rounded-xl bg-[#00236C] px-4 py-3 text-sm font-bold text-white"
                      >
                        Save
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      This target is saved to your profile.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        <section className="mx-auto hidden max-w-7xl gap-3 px-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6 lg:grid-cols-4 lg:px-10">
          <StatCard
            icon="🏃"
            label="Total distance"
            value={`${formatKm(totalKm)} km`}
            detail="contributed"
            accent="blue"
          />
          <StatCard
            icon="👣"
            label="Target"
            value="7,000 km"
            detail="our goal"
            accent="aqua"
          />
          <StatCard
            icon="👥"
            label="Contributors"
            value={contributorCount}
            detail="students & staff"
            accent="blue"
          />
          <StatCard
            icon="★"
            label="Progress"
            value={`${progress.toFixed(1)}%`}
            detail="of our goal"
            accent="pink"
          />
        </section>

        {isLoading && (
          <p className="mx-auto mt-4 max-w-7xl px-4 text-sm text-slate-500 sm:px-6 lg:px-10">
            Loading challenge data...
          </p>
        )}

        {account && !isStaff && !profile.profileComplete && view !== "profile" && (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="rounded-2xl border border-[#FF2BD6]/30 bg-white p-4 shadow-sm">
              <p className="font-bold text-[#00236C]">
                Welcome, {firstName}. Please complete your profile before logging activity.
              </p>
              <button
                onClick={() => setView("profile")}
                className="mt-3 rounded-xl bg-[#00236C] px-4 py-2 text-sm font-bold text-white"
              >
                Complete profile
              </button>
            </div>
          </div>
        )}

        {view === "profile" ? (
          <section className="mx-auto mt-3 max-w-3xl px-4 sm:mt-4 sm:px-6 lg:px-10">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-2xl font-bold text-[#00236C]">Your profile</h2>
                <p className="mt-2 text-slate-600">
                  {isStaff ? "Choose your house if you are attached to one. Otherwise select None." : "These details help us track progress by year group and house."}
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-[#00236C]">
                      Name
                    </label>
                    <input
                      disabled
                      value={cleanDisplayName || form.name}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-[#00236C]">
                      {isStaff ? "Staff status" : "Year group"}
                    </label>
                    <select
                      disabled={isStaff}
                      value={isStaff ? "Staff" : profile.yearGroup}
                      onChange={(e) =>
                        setProfile((previous) => ({
                          ...previous,
                          yearGroup: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C] disabled:bg-slate-100"
                    >
                      {yearGroups.map((group) => (
                        <option key={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-[#00236C]">
                      House
                    </label>
                    <select
                      value={isStaff ? profile.house || "None" : profile.house}
                      onChange={(e) =>
                        setProfile((previous) => ({
                          ...previous,
                          house: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C] disabled:bg-slate-100"
                    >
                      {(isStaff ? staffHouses : studentHouses).map((house) => (
                        <option key={house}>{house}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-[#00236C]">
                      Personal target in km
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={profile.personalTargetKm || 5}
                      onChange={(e) =>
                        setProfile((previous) => ({
                          ...previous,
                          personalTargetKm: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C]"
                      placeholder="e.g. 25"
                    />
                    <p className="mt-1 text-sm text-slate-500">
                      This is your sponsored distance target. You can change it later.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-[#00236C]">
                      Personal sponsored target in km
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={profile.personalTargetKm || 5}
                      onChange={(e) =>
                        setProfile((previous) => ({
                          ...previous,
                          personalTargetKm: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C]"
                      placeholder="e.g. 25"
                    />
                    <p className="mt-1 text-sm text-slate-500">
                      This is your personal sponsored distance target. You can update it later.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#EFFFFD] p-4 text-sm text-[#00236C]">
                    <p className="font-bold">Privacy note</p>
                    <p className="mt-1">
                      The app stores your name, email, year group, house and activity entries.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    className="w-full rounded-2xl bg-[#00236C] py-4 text-base font-bold text-white hover:bg-[#001A50]"
                  >
                    Save profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : view === "student" ? (
          <section className="mx-auto mt-3 grid max-w-7xl gap-3 px-4 sm:mt-4 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-10">
            <div className="space-y-4">
              <Card className="hidden rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold uppercase text-[#00236C]">
                        Whole school progress
                      </h2>
                      <p className="mt-3 text-4xl font-extrabold sm:text-5xl">
                        {formatKm(totalKm)} <span className="text-xl">km</span>{" "}
                        <span className="text-base font-normal text-slate-500">
                          completed
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold">
                        7,000 <span className="text-base">km</span>
                      </p>
                      <p className="text-sm text-slate-500">our target</p>
                    </div>
                  </div>

                  <div className="h-9 overflow-hidden rounded-xl bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(progress, 7)}%` }}
                      transition={{ duration: 0.8 }}
                      className="flex h-full items-center justify-end rounded-xl bg-gradient-to-r from-[#FF2BD6] to-[#6D2077] pr-3 text-sm font-bold text-white"
                    >
                      {progress.toFixed(1)}%
                    </motion.div>
                  </div>

                  <div className="mt-4 flex flex-col justify-between gap-2 text-base sm:flex-row">
                    <p>
                      <span className="font-bold text-[#00AFC4]">
                        {formatKm(remaining)} km
                      </span>{" "}
                      to go
                    </p>
                    <p className="italic text-[#FF2BD6]">
                      Let’s get to Snehalaya! ♡
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                id="log-section"
                className={`scroll-mt-6 rounded-3xl border bg-white shadow-sm transition-all duration-300 ${
                  highlightLogForm
                    ? "border-[#FF2BD6] ring-4 ring-[#FF2BD6]/30"
                    : "border-slate-200"
                }`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <IconBox>🏃</IconBox>
                    <h3 className="text-lg font-bold uppercase">
                      Log your activity
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 text-sm font-bold">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, type: "km" })}
                        className={`rounded-lg py-2 ${
                          form.type === "km"
                            ? "bg-[#00236C] text-white"
                            : "text-slate-500"
                        }`}
                      >
                        KM
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, type: "steps" })}
                        className={`rounded-lg py-2 ${
                          form.type === "steps"
                            ? "bg-[#00236C] text-white"
                            : "text-slate-500"
                        }`}
                      >
                        STEPS
                      </button>
                    </div>

                    {isStaff && (
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logMode: "personal" })}
                          className={`rounded-xl py-2 ${
                            form.logMode === "personal"
                              ? "bg-white text-[#00236C] shadow-sm"
                              : "text-slate-500"
                          }`}
                        >
                          My activity
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, logMode: "classTotal" })
                          }
                          className={`rounded-xl py-2 ${
                            form.logMode === "classTotal"
                              ? "bg-white text-[#00236C] shadow-sm"
                              : "text-slate-500"
                          }`}
                        >
                          Class total
                        </button>
                      </div>
                    )}

                    {isStaff && form.logMode === "classTotal" && (
                      <div className="rounded-2xl border border-[#1CFFE3]/40 bg-[#EFFFFD] p-4 text-sm text-[#00236C]">
                        <p className="font-bold">Class combined total</p>
                        <p className="mt-1">
                          Use this when a tutor is logging activity collected from a whole junior class. It will count towards the year group total, but not towards a house total.
                        </p>
                      </div>
                    )}

                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C] disabled:bg-slate-100"
                      value={form.name}
                      disabled={!!account}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Name"
                    />

                    {isStaff && form.logMode === "classTotal" ? (
                      <div>
                        <label className="mb-1 block text-sm font-bold text-[#00236C]">
                          Year group for class total
                        </label>
                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C]"
                          value={form.classYearGroup}
                          onChange={(e) =>
                            setForm({ ...form, classYearGroup: e.target.value })
                          }
                        >
                          {yearGroups
                            .filter((group) => group !== "Staff")
                            .map((group) => (
                              <option key={group}>{group}</option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C] disabled:bg-slate-100"
                          value={isStaff ? "Staff" : profile.yearGroup}
                          disabled={!!account}
                          onChange={(e) =>
                            setProfile({ ...profile, yearGroup: e.target.value })
                          }
                        >
                          {yearGroups.map((group) => (
                            <option key={group}>{group}</option>
                          ))}
                        </select>

                        <select
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#00236C] disabled:bg-slate-100"
                          value={isStaff ? profile.house || "None" : profile.house}
                          disabled={!!account && !isStaff}
                          onChange={(e) =>
                            isStaff
                              ? setProfile({ ...profile, house: e.target.value })
                              : setProfile({ ...profile, house: e.target.value })
                          }
                        >
                          {(isStaff ? staffHouses : studentHouses).map((house) => (
                            <option key={house}>{house}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.type === "steps" ? (
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C]"
                        value={form.steps}
                        onChange={(e) =>
                          setForm({ ...form, steps: e.target.value })
                        }
                        placeholder="Steps, e.g. 10000"
                      />
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[#00236C]"
                        value={form.km}
                        onChange={(e) =>
                          setForm({ ...form, km: e.target.value })
                        }
                        placeholder="Kilometres, e.g. 5.0"
                      />
                    )}

                    <div className="rounded-2xl bg-[#EFFFFD] p-4 text-center text-sm text-[#00236C]">
                      <p className="font-bold">Steps to km conversion</p>
                      <p className="mt-1">10,000 steps ≈ 8 km</p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-none bg-[#00236C] py-6 text-base font-bold text-white hover:bg-[#001A50]"
                    >
                      Log Activity
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="hidden rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="mb-5 text-lg font-bold uppercase">
                    Milestone achievements
                  </h3>
                  <div className="grid grid-cols-4 gap-4 text-center text-xs sm:grid-cols-7">
                    {[500, 1000, 2000, 3000, 4500, 5500, 7000].map((m) => {
                      const done = totalKm >= m;
                      return (
                        <div key={m} className="space-y-2">
                          <div
                            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                              done
                                ? "border-[#FF2BD6] bg-[#FF2BD6] text-white"
                                : "border-dashed border-slate-300 bg-white text-[#00236C]"
                            }`}
                          >
                            {done ? "✓" : m === 7000 ? "♡" : "⚑"}
                          </div>
                          <p className="font-bold">{m.toLocaleString()} km</p>
                          <p className="text-slate-500">
                            {done ? "Achieved" : m === nextMilestone ? "Next target" : "Goal"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="hidden space-y-4 lg:block">
              <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                <div className="h-20 bg-[#00236C]">
                  <div className="h-full bg-gradient-to-r from-[#00236C] via-[#6D2077] to-[#FF2BD6] opacity-90" />
                </div>
                <CardContent className="relative p-5 pt-10">
                  <div className="absolute -top-8 left-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#FF2BD6] text-xl font-bold text-white shadow-sm">
                    {account ? initials(cleanDisplayName) : "EC"}
                  </div>
                  <h3 className="mt-3 text-2xl font-bold">
                    {account ? cleanDisplayName : "Emily C."}
                  </h3>
                  <p>{isStaff ? "Staff" : profile.yearGroup}</p>
                  {!account && (
                    <button
                      onClick={handleMicrosoftLogin}
                      className="mt-2 text-sm font-bold text-[#FF2BD6] underline"
                    >
                      Sign in for your profile
                    </button>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-bold uppercase">My progress</h3>
                  <p className="mt-4 text-4xl font-extrabold">
                    {formatKm(myTotalKm)} <span className="text-lg">km</span>
                  </p>
                  <p className="text-slate-500">total contributed</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#FF2BD6]"
                      style={{
                        width: `${personalProgress}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {personalRemaining > 0
                      ? `${formatKm(personalRemaining)} km to your target`
                      : "Personal target reached!"}
                  </p>

                  <div className="mt-5 rounded-2xl bg-[#F7FAFF] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Weekly streak
                        </p>
                        <p className="mt-1 text-2xl font-extrabold text-[#00236C]">
                          2 / 3 days
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF2BD6] text-white">
                          ✓
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D2077] text-white">
                          ✓
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400">
                          •
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Log activity on one more day this week to complete your
                      streak.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#EFFFFD] p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Personal target
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-[#00236C]">
                      {formatKm(personalTargetKm)} km
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Your sponsored distance target
                    </p>
                  </div>

                  <p className="mt-4 italic text-[#FF2BD6]">
                    Consistency matters more than competition ☆
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex justify-between">
                    <h3 className="font-bold uppercase">Recent activity</h3>
                  </div>
                  {entries.slice(0, 4).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF2BD6] text-xs font-bold text-white">
                        {initials(entry.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{entry.name}</p>
                        <p className="text-xs text-slate-500">
                          Logged {formatKm(entry.km)} km
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 bg-[#00236C] text-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold uppercase">Next milestone</h3>
                  <p className="mt-5 text-4xl font-extrabold">
                    {nextMilestone.toLocaleString()}{" "}
                    <span className="text-lg">km</span>
                  </p>
                  <p className="mt-2">
                    Only {formatKm(nextMilestone - totalKm)} km to go!
                  </p>
                </CardContent>
              </Card>
            </aside>
          </section>
        ) : (
          <section className="mx-auto mt-4 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-10">
            <div className="grid gap-4 lg:grid-cols-3">
              <TeacherLeaderboard rows={individualLeaders} title="Individuals" />
              <TeacherLeaderboard rows={groupLeaders} title="Year groups" />
              <TeacherLeaderboard rows={houseLeaders} title="Houses" />
            </div>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">Teacher dashboard</h3>
                  <Button className="border-[#00236C] bg-white px-4 py-2 text-[#00236C]">
                    Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Group</th>
                        <th className="px-4 py-3">House</th>
                        <th className="px-4 py-3">Entry</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-4 py-3 font-medium">
                            {entry.name}
                          </td>
                          <td className="px-4 py-3">{entry.group}</td>
                          <td className="px-4 py-3">{entry.house}</td>
                          <td className="px-4 py-3">
                            {formatKm(entry.km)} km
                          </td>
                          <td className="px-4 py-3">{entry.date}</td>
                          <td className="px-4 py-3 text-xs">
                            {entry.email || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {entry.entryMode === "classTotal" ? "Class total" : "Personal"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Moderation check</p>
                  <p>
                    {unusualEntries.length === 0
                      ? "No unusual entries currently flagged."
                      : `${unusualEntries.length} entries are over 50 km and should be checked.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="hidden bg-[#00236C] px-10 py-5 text-sm font-semibold text-white lg:ml-72 lg:flex lg:items-center lg:justify-between">
        <span>LEICESTER HIGH SCHOOL</span>
        <span>Together we can go further</span>
        <span>#LHMovesForSnehalaya ♡</span>
      </footer>

      <MobileNav view={view} setView={setView} scrollToLogForm={scrollToLogForm} />
    </div>
  );
}
