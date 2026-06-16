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
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithMicrosoft,
  getMicrosoftRedirectResult,
  signOutUser,
} from "./authConfig.js";
import { db } from "./firebase.js";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Button } from "./components/ui/button.jsx";

const TARGET_KM = 7000;
const STEPS_TO_KM = 0.0008;
const DONATION_URL = "https://pay.sumup.com/b2c/Q57X6QTI";

const routeMilestones = [
  { name: "Leicester", km: 0, detail: "Starting together" },
  { name: "Paris", km: 520, detail: "First international milestone" },
  { name: "Milan", km: 1200, detail: "Across Europe" },
  { name: "Athens", km: 2500, detail: "Heading south-east" },
  { name: "Cairo", km: 3700, detail: "Beyond Europe" },
  { name: "Dubai", km: 5300, detail: "Closing in on India" },
  { name: "Mumbai", km: 6600, detail: "Nearly there" },
  { name: "Snehalaya", km: 7000, detail: "Journey complete" },
];

const badgeDefinitions = [
  { name: "First Steps", km: 1, icon: "👣", detail: "Logged your first kilometre" },
  { name: "5 km Starter", km: 5, icon: "⭐", detail: "Reached 5 km" },
  { name: "10 km Champion", km: 10, icon: "🏃", detail: "Reached 10 km" },
  { name: "Half Marathon", km: 21.1, icon: "🎽", detail: "Reached 21.1 km" },
  { name: "Marathon", km: 42.2, icon: "🏅", detail: "Reached 42.2 km" },
  { name: "Century Club", km: 100, icon: "💯", detail: "Reached 100 km" },
];
const PLEASE_SELECT = "Please select";
const yearGroups = [
  "EYFS",
  "Year 1",
  "Year 2",
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

const activeYearGroups = [
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "Year 13",
  "Staff",
];

const contributorOrder = [
  "Year 13",
  "Year 12",
  "Year 11",
  "Year 10",
  "Year 9",
  "Year 8",
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

function CelebrationConfetti() {
  const pieces = Array.from({ length: 36 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {pieces.map((_, index) => {
        const left = `${(index * 17) % 100}%`;
        const delay = `${(index % 9) * 0.18}s`;
        const duration = `${2.8 + (index % 5) * 0.35}s`;
        const symbol = ["★", "♡", "✦", "●"][index % 4];

        return (
          <span
            key={index}
            className="absolute -top-8 text-lg"
            style={{
              left,
              animation: `confettiFall ${duration} linear ${delay} infinite`,
              color: index % 3 === 0 ? "#FF2BD6" : index % 3 === 1 ? "#1CFFE3" : "#00236C",
            }}
          >
            {symbol}
          </span>
        );
      })}
    </div>
  );
}

function PublicSplashScreen({
  totalKm,
  progress,
  remaining,
  challengeComplete = false,
  handleMicrosoftLogin,
  isInAppBrowser = false,
}) {
  return (
    <div className="min-h-screen bg-[#F7FAFF] text-[#00236C]">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(360px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 sm:p-10">
          {challengeComplete && <CelebrationConfetti />}
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


          <div className="mt-6">
            <ParkrunEventCard showRsvp={false} />
            <p className="mt-2 text-xs text-slate-500">
              Sign in to say you are coming.
            </p>
          </div>

          <div className="mt-10 rounded-3xl bg-[#F7FAFF] p-6 text-left">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-slate-500">
                  {remaining <= 0 ? "We made it!" : "Whole-school progress"}
                </p>

                <p className="mt-2 text-5xl font-extrabold">
                  {totalKm.toFixed(1)} km
                </p>
                {totalKm > 7000 && (
                  <p className="text-sm font-bold text-[#FF2BD6] mt-1 animate-pulse">
                    +{formatKm(totalKm - 7000)} km past target!
                  </p>
                )}
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

          {isInAppBrowser && (
            <div className="mb-4 rounded-2xl border border-[#FFCC80] bg-[#FFF4E5] p-4 text-left text-sm text-[#663C00]">
              <p className="font-bold">Open in Safari or Chrome</p>
              <p className="mt-1">
                Microsoft sign-in may not work properly inside WhatsApp or other
                in-app browsers.
              </p>
              <p className="mt-1 font-semibold">
                Please use your browser menu and choose:
                <br />
                Open in Safari / Open in Chrome
              </p>
            </div>
          )}


          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="mt-8 w-full rounded-2xl bg-[#00236C] px-5 py-4 text-base font-bold text-white shadow-sm hover:bg-[#001A50]"
          >
            Sign in with Microsoft 365
          </button>

          <a
            href={DONATION_URL}
            target="_blank"
            rel="noreferrer"
            className={`mt-3 block w-full rounded-2xl px-5 py-4 text-center text-base font-bold shadow-sm ${
              challengeComplete
                ? "bg-[#FF2BD6] text-white hover:bg-[#D91DB7]"
                : "border-2 border-[#FF2BD6] bg-white text-[#00236C] hover:bg-[#FFF0FB]"
            }`}
          >
            {challengeComplete
              ? "Celebrate by Supporting Snehalaya"
              : "Support Our Snehalaya Partnership"}
          </a>

          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Donations support our partnership with Snehalaya and the vital work
            they do with children and families in India.
          </p>

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

function TeacherLeaderboard({ rows, title, showAll = false }) {
  const displayedRows = showAll ? rows : rows.slice(0, 5);

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
          {displayedRows.map((row, index) => (
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



function MobileRouteSummary({ totalKm, challengeComplete }) {
  const nextMilestone =
    routeMilestones.find((milestone) => milestone.km > totalKm) ||
    routeMilestones[routeMilestones.length - 1];

  const reachedCount = routeMilestones.filter((milestone) => totalKm >= milestone.km).length;
  const kmToNext = Math.max(nextMilestone.km - totalKm, 0);

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm sm:hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Route progress
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#00236C]">
              {challengeComplete ? "Route complete" : `Next: ${nextMilestone.name}`}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {challengeComplete
                ? "Leicester High has reached Snehalaya."
                : `${formatKm(kmToNext)} km to the next milestone`}
            </p>
          </div>
          <div className="rounded-2xl bg-[#EFFFFD] px-4 py-3 text-center">
            <p className="text-2xl font-black text-[#00236C]">
              {reachedCount}/{routeMilestones.length}
            </p>
            <p className="text-xs text-slate-500">milestones</p>
          </div>
        </div>

        <div className="mt-4 flex gap-1">
          {routeMilestones.map((milestone) => {
            const reached = totalKm >= milestone.km;

            return (
              <div
                key={milestone.name}
                className={`h-2 flex-1 rounded-full ${
                  reached ? "bg-[#FF2BD6]" : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MobileBadgeSummary({ myTotalKm }) {
  const earnedBadges = badgeDefinitions.filter((badge) => myTotalKm >= badge.km);
  const nextBadge = badgeDefinitions.find((badge) => myTotalKm < badge.km);

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm sm:hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Badges
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#00236C]">
              {earnedBadges.length} earned
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {nextBadge
                ? `Next badge: ${nextBadge.name} at ${formatKm(nextBadge.km)} km`
                : "All badges unlocked!"}
            </p>
          </div>
          <div className="flex -space-x-2">
            {badgeDefinitions.slice(0, 3).map((badge) => {
              const earned = myTotalKm >= badge.km;
              return (
                <div
                  key={badge.name}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-lg ${
                    earned ? "bg-[#FF2BD6] text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {earned ? badge.icon : "🔒"}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteMilestones({ totalKm, challengeComplete }) {
  const currentMilestoneIndex = routeMilestones.reduce(
    (latest, milestone, index) => (totalKm >= milestone.km ? index : latest),
    0
  );

  const nextMilestone =
    routeMilestones.find((milestone) => milestone.km > totalKm) ||
    routeMilestones[routeMilestones.length - 1];

  const kmToNext = Math.max(nextMilestone.km - totalKm, 0);

  return (
    <Card className="hidden rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Route map
            </p>
            <h3 className="text-xl font-bold text-[#00236C]">
              Leicester to Snehalaya
            </h3>
          </div>
          <div className="rounded-2xl bg-[#EFFFFD] px-3 py-2 text-right text-xs font-bold text-[#00236C]">
            {challengeComplete
              ? "Route complete"
              : `${formatKm(kmToNext)} km to ${nextMilestone.name}`}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-slate-200 sm:left-1/2 sm:h-1 sm:w-full sm:-translate-x-1/2 sm:translate-y-3" />

          <div className="relative grid gap-4 sm:grid-cols-8">
            {routeMilestones.map((milestone, index) => {
              const reached = totalKm >= milestone.km;
              const current = index === currentMilestoneIndex && !challengeComplete;

              return (
                <div
                  key={milestone.name}
                  className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center"
                >
                  <div
                    className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black shadow-sm ${
                      reached
                        ? "border-[#FF2BD6] bg-[#FF2BD6] text-white"
                        : current
                        ? "border-[#1CFFE3] bg-[#1CFFE3] text-[#00236C]"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {reached ? "✓" : index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${reached ? "text-[#00236C]" : "text-slate-500"}`}>
                      {milestone.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {milestone.km.toLocaleString()} km
                    </p>
                    <p className="hidden text-xs text-slate-400 sm:block">
                      {milestone.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementBadges({ myTotalKm }) {
  return (
    <Card id="badges-section" className="hidden scroll-mt-6 rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Achievement badges
          </p>
          <h3 className="text-xl font-bold text-[#00236C]">
            Your progress badges
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {badgeDefinitions.map((badge) => {
            const earned = myTotalKm >= badge.km;

            return (
              <div
                key={badge.name}
                className={`rounded-2xl border p-4 text-center ${
                  earned
                    ? "border-[#FF2BD6]/30 bg-[#FFF0FB]"
                    : "border-slate-200 bg-slate-50 opacity-70"
                }`}
              >
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                    earned
                      ? "bg-[#FF2BD6] text-white"
                      : "bg-white text-slate-400"
                  }`}
                >
                  {earned ? badge.icon : "🔒"}
                </div>
                <p className="mt-3 text-sm font-bold text-[#00236C]">
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {earned ? badge.detail : `${formatKm(badge.km)} km`}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


function ParkrunEventCard({ isAttending = false, onToggle, showRsvp = true }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="rounded-3xl border-[#1CFFE3]/40 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              School parkrun event
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#00236C]">
              Victoria Park parkrun · 27 June
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Join Leicester High at 9.00 am to walk, run or jog 5 km together.
            </p>
          </div>
          <div className="hidden rounded-2xl bg-[#EFFFFD] px-3 py-2 text-center sm:block">
            <p className="text-lg font-black text-[#00236C]">5 km</p>
            <p className="text-xs text-slate-500">walk/run/jog</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {showRsvp && (
            <button
              type="button"
              onClick={onToggle}
              className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                isAttending
                  ? "bg-[#FF2BD6] text-white hover:bg-[#D91DB7]"
                  : "bg-[#00236C] text-white hover:bg-[#001A50]"
              }`}
            >
              {isAttending ? "I'm in ✓" : "I'm in!"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((previous) => !previous)}
            className="rounded-2xl border border-[#00236C] bg-white px-4 py-3 text-sm font-bold text-[#00236C]"
          >
            {showDetails ? "Hide info" : "More info"}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 rounded-2xl bg-[#F7FAFF] p-4 text-sm leading-relaxed text-slate-600">
            <p>
              <strong className="text-[#00236C]">When:</strong> Saturday 27 June, 9.00 am
            </p>
            <p className="mt-1">
              <strong className="text-[#00236C]">Where:</strong> Victoria Park, Leicester
            </p>
            <p className="mt-1">
              Everyone is welcome to walk, run or jog the 5 km route.
            </p>
            <p className="mt-2">
              If you are new to parkrun, register first so your participation can be recorded:
            </p>
            <a
              href="https://www.parkrun.org.uk/register/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-bold text-[#00236C] underline"
            >
              Register for parkrun
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MobileNav({ view, setView, scrollToLogForm, isStaff }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className={`mx-auto grid max-w-md ${isStaff ? "grid-cols-4" : "grid-cols-3"} gap-2 text-xs font-medium`}>
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
        {isStaff && (
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
        )}
        <a
          href={DONATION_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl px-3 py-2 text-center text-slate-600"
        >
          ♡
          <br />
          Donate
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [publicStats, setPublicStats] = useState({
    totalKm: 0,
    targetKm: 7000,
  });
  const [view, setView] = useState("student");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [highlightLogForm, setHighlightLogForm] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    group: PLEASE_SELECT,
    house: PLEASE_SELECT,
    type: "km",
    logMode: "personal",
    classYearGroup: "Year 3",
    steps: "",
    km: "",
  });

  const [account, setAccount] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const ua = navigator.userAgent || "";

  const isInAppBrowser =
    ua.includes("FBAN") ||
    ua.includes("FBAV") ||
    ua.includes("Instagram") ||
    ua.includes("WhatsApp");

  const rawAccountName = account?.displayName || "";
  const cleanDisplayName = displayNameWithoutStaffTag(rawAccountName);
  const firstName = firstNameFromDisplayName(rawAccountName);
  const isStaff = rawAccountName.toLowerCase().includes("(staff)");

  const [profile, setProfile] = useState({
    yearGroup: PLEASE_SELECT,
    house: PLEASE_SELECT,
    personalTargetKm: 5,
    parkrunAttending: false,
    profileComplete: false,
  });

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};

    async function initialiseAuth() {
      try {
        await getMicrosoftRedirectResult();
      } catch (error) {
        console.error("Redirect sign-in failed:", error);
      }

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!mounted) return;
        setAccount(user);
        setAuthLoading(false);
      });
    }

    initialiseAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadUserProfile() {
      if (!account) return;

      const userRef = doc(db, "users", account.uid);
      const snapshot = await getDoc(userRef);

      const defaultProfile = {
        yearGroup: isStaff ? "Staff" : PLEASE_SELECT,
        house: isStaff ? "None" : PLEASE_SELECT,
        personalTargetKm: 5,
        parkrunAttending: false,
        profileComplete: isStaff,
      };

      const loadedProfile = snapshot.exists()
        ? { ...defaultProfile, ...snapshot.data() }
        : defaultProfile;

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
    async function loadPublicStats() {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const statsRef = doc(db, "publicStats", "challenge");
        const statsSnap = await getDoc(statsRef);

        if (statsSnap.exists()) {
          setPublicStats(statsSnap.data());
        }
      } catch (error) {
        console.error("Error loading public stats:", error);
      }
    }

    loadPublicStats();
  }, []);

  useEffect(() => {
    async function loadEntries() {
      if (!account) {
        setEntries([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

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
  }, [account]);

  useEffect(() => {
    async function loadUserProfiles() {
      if (!account) {
        setUserProfiles([]);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, "users"));

        const loadedProfiles = snapshot.docs.map((userDoc) => ({
          id: userDoc.id,
          ...userDoc.data(),
        }));

        setUserProfiles(loadedProfiles);
      } catch (error) {
        console.error("Error loading user profiles:", error);
      }
    }

    loadUserProfiles();
  }, [account, profile.parkrunAttending]);

  useEffect(() => {
    if (!isStaff && view === "staff") {
      setView("student");
    }
  }, [isStaff, view]);

  async function handleSaveProfile() {
  if (!account) {
      alert("Please sign in first.");
      return;
    }

    if (!isStaff && (profile.yearGroup === PLEASE_SELECT || profile.house === PLEASE_SELECT)) {
      alert("Please select both your year group and house.");
      return;
    }

    if (profile.personalTargetKm === "" || Number(profile.personalTargetKm) <= 0) {
      alert("Please enter a personal target greater than 0 km.");
      return;
    }

    const profileToSave = {
      displayName: cleanDisplayName,
      email: account.email || "",
      yearGroup: isStaff ? "Staff" : profile.yearGroup,
      house: isStaff ? profile.house || "None" : profile.house,
      personalTargetKm:
        profile.personalTargetKm === ""
          ? ""
          : Number(profile.personalTargetKm || 5),
      parkrunAttending: Boolean(profile.parkrunAttending),
      isStaff,
      profileComplete: true,
      updatedAt: new Date(),
    };

    try {
      await setDoc(doc(db, "users", account.uid), profileToSave, {
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



  async function handleParkrunToggle() {
    if (!account) {
      alert("Please sign in first.");
      return;
    }

    const nextValue = !Boolean(profile.parkrunAttending);

    const updatedProfile = {
      ...profile,
      displayName: cleanDisplayName,
      email: account.email || "",
      yearGroup: isStaff ? "Staff" : profile.yearGroup,
      house: isStaff ? profile.house || "None" : profile.house,
      personalTargetKm: Number(profile.personalTargetKm || 5),
      parkrunAttending: nextValue,
      isStaff,
      profileComplete: Boolean(profile.profileComplete || isStaff),
      updatedAt: new Date(),
    };

    try {
      await setDoc(doc(db, "users", account.uid), updatedProfile, {
        merge: true,
      });

      setProfile(updatedProfile);

      // Update the staff dashboard list immediately, without waiting for a reload.
      setUserProfiles((previousProfiles) => {
        const withoutCurrentUser = previousProfiles.filter(
          (userProfile) => userProfile.id !== account.uid
        );

        return [
          ...withoutCurrentUser,
          {
            id: account.uid,
            ...updatedProfile,
          },
        ];
      });
    } catch (error) {
      console.error("Error updating parkrun response:", error);
      alert("Could not update your parkrun response. Please try again.");
    }
  }

  async function refreshParkrunResponses() {
    if (!account) return;

    try {
      const snapshot = await getDocs(collection(db, "users"));

      const loadedProfiles = snapshot.docs.map((userDoc) => ({
        id: userDoc.id,
        ...userDoc.data(),
      }));

      setUserProfiles(loadedProfiles);
    } catch (error) {
      console.error("Error refreshing parkrun responses:", error);
      alert("Could not refresh parkrun responses.");
    }
  }

  async function handleMicrosoftLogin() {
    try {
      await signInWithMicrosoft();
    } catch (error) {
      console.error("Login failed:", error);
      alert(`Could not sign in: ${error.code || error.message}`);
    }
  }

  async function handleMicrosoftLogout() {
    try {
      await signOutUser();
      setAccount(null);
      setView("student");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  function scrollToLogForm() {
    setView("student");
    setHighlightLogForm(true);

    setTimeout(() => {
      const logTarget =
        document.getElementById("log-section") ||
        document.getElementById("log");

      logTarget?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    setTimeout(() => {
      setHighlightLogForm(false);
    }, 1800);
  }

  function scrollToSection(sectionId) {
    setView("student");

    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  async function updatePublicChallengeTotal(kmDelta) {
    if (!kmDelta) return;

    try {
      await updateDoc(doc(db, "publicStats", "challenge"), {
        totalKm: increment(Number(kmDelta)),
        targetKm: TARGET_KM,
        updatedAt: new Date().toISOString().slice(0, 10),
      });

      setPublicStats((previous) => ({
        ...previous,
        totalKm: Math.max(Number(previous.totalKm || 0) + Number(kmDelta), 0),
        targetKm: previous.targetKm || TARGET_KM,
        updatedAt: new Date().toISOString().slice(0, 10),
      }));
    } catch (error) {
      console.error("Error updating public challenge total:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const km =
      form.type === "steps"
        ? Number(form.steps || 0) * STEPS_TO_KM
        : Number(form.km || 0);

    const isClassTotal = isStaff && form.logMode === "classTotal";

    if (account && !isStaff && !profile.profileComplete) {
      alert("Please complete your profile first.");
      setView("profile");
      return;
    }

    if (!isStaff && (profile.yearGroup === PLEASE_SELECT || profile.house === PLEASE_SELECT)) {
      alert("Please select your year group and house in your profile first.");
      setView("profile");
      return;
    }

    if (isStaff && form.logMode === "personal" && !profile.house) {
      alert("Please choose your staff house, or select None.");
      setView("profile");
      return;
    }

    if (!form.name.trim() || km <= 0) {
      alert("Please enter a name and a distance greater than 0.");
      return;
    }

    if (km > 40) {
      const confirmed = confirm(
        `You are about to log ${formatKm(km)} km. This is a high entry. Is it correct?`
      );

      if (!confirmed) return;
    }

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
      userId: account?.uid || "anonymous",
      email: account?.email || "",
      loggedBy: cleanDisplayName || form.name.trim(),
    };

    try {
      const docRef = await addDoc(collection(db, "entries"), newEntry);
      await updatePublicChallengeTotal(newEntry.km);

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

    const entryToDelete = entries.find((entry) => entry.id === entryId);

    try {
      await deleteDoc(doc(db, "entries", entryId));

      if (entryToDelete) {
        await updatePublicChallengeTotal(-Number(entryToDelete.km || 0));
      }

      setEntries(entries.filter((entry) => entry.id !== entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Could not delete entry. Check the browser console.");
    }
  }

  async function handleDeleteOwnEntry(entryId) {
    const entry = entries.find((item) => item.id === entryId);

    const currentUserEmail = (account?.email || "").toLowerCase();
    const entryEmail = (entry?.email || "").toLowerCase();

    const canDeleteEntry =
      entry &&
      (isStaff ||
        entry.userId === account?.uid ||
        (currentUserEmail && entryEmail === currentUserEmail));

    if (!canDeleteEntry) {
      alert("You can only delete your own entries.");
      return;
    }

    await handleDeleteEntry(entryId);
  }

  const rawTotalKm = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.km || 0), 0),
    [entries]
  );

  const challengeComplete = rawTotalKm >= TARGET_KM;
  const totalKm = rawTotalKm;
  const displayTotalKm = account ? totalKm : (publicStats.totalKm || 0);
  const displayTargetKm = publicStats.targetKm || TARGET_KM;

  const progress = Math.min((displayTotalKm / displayTargetKm) * 100, 100);
  const remaining = Math.max(displayTargetKm - displayTotalKm, 0);
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

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const timeA = a.createdAt?.seconds 
        ? a.createdAt.seconds * 1000 
        : a.createdAt?.toDate 
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt || a.date || 0).getTime();
      const timeB = b.createdAt?.seconds 
        ? b.createdAt.seconds * 1000 
        : b.createdAt?.toDate 
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [entries]);

  const individualLeaders = useMemo(() => totalsBy("name"), [entries]);
  const groupLeaders = useMemo(() => {
    const totals = {};
    yearGroups.forEach((g) => {
      totals[g] = 0;
    });

    entries.forEach((entry) => {
      const g = entry.group || "Unknown";
      if (totals[g] !== undefined) {
        totals[g] += Number(entry.km || 0);
      }
    });

    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [entries]);

  const groupContributors = useMemo(() => {
    const contributorSets = {};
    contributorOrder.forEach((g) => {
      contributorSets[g] = new Set();
    });

    entries.forEach((entry) => {
      const g = entry.group || "Unknown";
      if (contributorSets[g] !== undefined) {
        const contributorId = entry.userId && entry.userId !== "anonymous"
          ? entry.userId
          : (entry.email || entry.name);
        
        if (entry.entryMode !== "classTotal") {
          contributorSets[g].add(contributorId);
        }
      }
    });

    return contributorOrder.map((name) => ({
      name,
      count: contributorSets[name].size,
    }));
  }, [entries]);

  const houseLeaders = useMemo(() => totalsBy("house"), [entries]);
  const unusualEntries = entries.filter((entry) => Number(entry.km || 0) > 50);
  const nextMilestone = Math.ceil(totalKm / 500) * 500 || 500;
  const contributorCount = new Set(entries.map((entry) => entry.name)).size;

  // Personal entries must be matched by authenticated user ID or email only.
  // Do not match by display name, as names are not unique.
  const currentUserEmail = (account?.email || "").toLowerCase();

  const myEntries = account
    ? sortedEntries.filter((entry) => {
        const entryEmail = (entry.email || "").toLowerCase();

        return (
          entry.userId === account.uid ||
          (currentUserEmail && entryEmail === currentUserEmail)
        );
      })
    : [];

  const handleExportCSV = () => {
    const headers = ["Name", "Group", "House", "Distance (km)", "Date", "Email", "Entry Type"];
    const csvContent = [
      headers.join(","),
      ...sortedEntries.map(entry => {
        const name = `"${(entry.name || "").replace(/"/g, '""')}"`;
        const group = `"${(entry.group || "").replace(/"/g, '""')}"`;
        const house = `"${(entry.house || "").replace(/"/g, '""')}"`;
        const km = entry.km || 0;
        const date = `"${(entry.date || "").replace(/"/g, '""')}"`;
        const email = `"${(entry.email || "").replace(/"/g, '""')}"`;
        const type = entry.entryMode === "classTotal" ? "Class total" : "Personal";
        return [name, group, house, km, date, email, type].join(",");
      })
    ].join("\n");

    navigator.clipboard.writeText(csvContent)
      .then(() => {
        setCsvCopied(true);
        setTimeout(() => setCsvCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy CSV: ", err);
        alert("Failed to copy CSV to clipboard.");
      });
  };

  const myTotalKm = myEntries.reduce(
    (sum, entry) => sum + Number(entry.km || 0),
    0
  );

  const weeklyLoggedDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() - daysSinceMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return new Set(
      myEntries
        .map((entry) => entry.date)
        .filter(Boolean)
        .filter((dateString) => {
          const entryDate = new Date(`${dateString}T12:00:00`);
          return entryDate >= monday && entryDate <= sunday;
        })
    );
  }, [myEntries]);

  const weeklyStreakTarget = 3;
  const weeklyStreakCount = weeklyLoggedDates.size;
  const weeklyStreakComplete = weeklyStreakCount >= weeklyStreakTarget;
  const weeklyStreakRemaining = Math.max(
    weeklyStreakTarget - weeklyStreakCount,
    0
  );

  const parkrunAttendees = useMemo(
    () =>
      userProfiles
        .filter((userProfile) => Boolean(userProfile.parkrunAttending))
        .map((userProfile) => ({
          name:
            userProfile.displayName ||
            userProfile.name ||
            userProfile.email ||
            "Unknown user",
          email: userProfile.email || "",
          yearGroup: userProfile.yearGroup || "—",
          house: userProfile.house || "—",
          isStaff: Boolean(userProfile.isStaff),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [userProfiles]
  );

  const personalTargetKm = Number(profile.personalTargetKm || 0);
  const personalProgress = personalTargetKm > 0
    ? Math.min((myTotalKm / personalTargetKm) * 100, 100)
    : 0;
  const personalRemaining = Math.max(personalTargetKm - myTotalKm, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] px-6 py-10 text-center text-[#00236C]">
        <div className="mx-auto mt-24 max-w-md rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-lg font-bold">Loading challenge...</p>
          <p className="mt-2 text-sm text-slate-500">
            Checking sign-in status.
          </p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <PublicSplashScreen
        totalKm={displayTotalKm}
        progress={progress}
        remaining={remaining}
        challengeComplete={challengeComplete}
        handleMicrosoftLogin={handleMicrosoftLogin}
        isInAppBrowser={isInAppBrowser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFF] pb-24 text-[#00236C] lg:pb-0">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(360px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-hidden bg-[#00236C] text-white lg:block">
        <div className="p-8">
          <SchoolLogo />
        </div>

        <nav className="space-y-2 px-4">
          {(isStaff ? [...navItems, "Staff Dashboard"] : navItems).map((item) => {
            const icons = {
              Dashboard: "🏠",
              "Log Activity": "🏃",
              Profile: "👤",
              "My Progress": "📈",
              Badges: "🛡️",
              "About Snehalaya": "♡",
              "How It Works": "ⓘ",
              "Staff Dashboard": "🔒",
            };

            const isActive =
              (item === "Dashboard" && view === "student") ||
              (item === "Profile" && view === "profile") ||
              (item === "Staff Dashboard" && view === "staff");

            return (
              <button
                key={item}
                onClick={() => {
                  if (item === "Dashboard") {
                    setView("student");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }

                  if (item === "Log Activity") {
                    scrollToLogForm();
                  }

                  if (item === "Profile") {
                    setView("profile");
                  }

                  if (item === "My Progress") {
                    scrollToSection("my-progress-section");
                  }

                  if (item === "Badges") {
                    scrollToSection("badges-section");
                  }

                  if (item === "About Snehalaya") {
                    scrollToSection("about-snehalaya-section");
                  }

                  if (item === "How It Works") {
                    scrollToSection("how-it-works-section");
                  }

                  if (item === "Staff Dashboard") {
                    setView("staff");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-base ${
                  isActive ? "bg-white/15 font-semibold" : "hover:bg-white/10"
                }`}
              >
                <span>{icons[item]}</span>
                {item}
              </button>
            );
          })}
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
                {account.displayName} · Sign out
              </Button>
            ) : (
              <Button
                onClick={handleMicrosoftLogin}
                className="hidden border-slate-200 bg-white px-4 py-2 text-[#00236C] shadow-sm lg:absolute lg:right-0 lg:top-0 lg:flex"
              >
                Sign in with Microsoft 365
              </Button>
            )}

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
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
              <button
                type="button"
                onClick={scrollToLogForm}
                className="block w-full rounded-2xl bg-[#00236C] px-5 py-3 text-center text-sm font-bold text-white shadow-sm"
              >
                Log activity
              </button>
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


        <section className="mx-auto mt-3 max-w-7xl px-4 sm:mt-4 sm:px-6 lg:px-10">
          <ParkrunEventCard
            isAttending={Boolean(profile.parkrunAttending)}
            onToggle={handleParkrunToggle}
          />
        </section>

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
                  {totalKm > 7000 && (
                    <p className="text-xs font-bold text-[#FF2BD6] mt-0.5 animate-pulse">
                      +{formatKm(totalKm - 7000)} km past target!
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {challengeComplete ? "7,000 km completed" : "completed"}
                  </p>
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
          <section id="my-progress-section-mobile" className="scroll-mt-6 mx-auto mt-3 px-4 sm:hidden">
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
                    {myTotalKm > personalTargetKm && (
                      <p className="text-xs font-bold text-[#FF2BD6] mt-0.5 animate-pulse">
                        +{formatKm(myTotalKm - personalTargetKm)} km past target!
                      </p>
                    )}
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
                {challengeComplete && personalRemaining > 0 && (
                  <p className="mt-1 text-xs font-semibold text-[#FF2BD6]">
                    Your personal target remains active.
                  </p>
                )}

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
                        value={profile.personalTargetKm ?? ""}
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

        {challengeComplete && (
          <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-10">
            <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-[#00236C] via-[#6D2077] to-[#FF2BD6] text-white shadow-lg">
              <CelebrationConfetti />
              <CardContent className="relative p-6 text-center sm:p-8">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#1CFFE3]">
                  Route complete
                </p>
                <h2 className="mt-2 text-3xl font-black sm:text-5xl">
                  Together we made it!
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
                  Leicester High has completed the 7,000 km journey to Snehalaya.
                  Personal sponsored targets remain open, so keep logging activity
                  if you are still working towards your own goal.
                </p>
                <a
                  href={DONATION_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#00236C] shadow-sm hover:bg-[#EFFFFD]"
                >
                  Celebrate by Supporting Snehalaya
                </a>
              </CardContent>
            </Card>
          </section>
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
                      {!isStaff && <option>{PLEASE_SELECT}</option>}
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
                      {!isStaff && <option>{PLEASE_SELECT}</option>}
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
                      value={profile.personalTargetKm ?? ""}
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
                      value={profile.personalTargetKm ?? ""}
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
              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm lg:hidden">
                <CardContent className="p-4">
                  <h3 className="font-bold uppercase text-[#00236C]">
                    My recent entries
                  </h3>

                  {myEntries.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      You have not logged any activity yet.
                    </p>
                  ) : (
                    <div className="mt-3 divide-y divide-slate-100">
                      {myEntries.slice(0, 3).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-[#00236C]">
                              {formatKm(entry.km)} km
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.date}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteOwnEntry(entry.id)}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <MobileRouteSummary
                totalKm={displayTotalKm}
                challengeComplete={challengeComplete}
              />

              <MobileBadgeSummary myTotalKm={myTotalKm} />

              <RouteMilestones
                totalKm={displayTotalKm}
                challengeComplete={challengeComplete}
              />

              <AchievementBadges myTotalKm={myTotalKm} />

              <Card id="about-snehalaya-section" className="hidden scroll-mt-6 rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    About Snehalaya
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[#00236C]">
                    Supporting children and families in India
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Snehalaya is our charity partner in India. This challenge helps
                    Leicester High raise awareness and support for their work with
                    vulnerable children, young people and families.
                  </p>
                  <a
                    href={DONATION_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block rounded-2xl bg-[#FF2BD6] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#D91DB7]"
                  >
                    Support Our Snehalaya Partnership
                  </a>
                </CardContent>
              </Card>

              <Card id="how-it-works-section" className="hidden scroll-mt-6 rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    How it works
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[#00236C]">
                    Log activity, build distance, support the journey
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#F7FAFF] p-4">
                      <p className="font-bold text-[#00236C]">1. Sign in</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Use your school Microsoft account.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#F7FAFF] p-4">
                      <p className="font-bold text-[#00236C]">2. Log distance</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Add kilometres or steps after a walk, run or jog.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#F7FAFF] p-4">
                      <p className="font-bold text-[#00236C]">3. Keep going</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Help the school reach Snehalaya and work towards your own target.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hidden rounded-3xl border-slate-200 bg-white shadow-sm sm:block">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold uppercase text-[#00236C]">
                        {challengeComplete ? "Route complete: We made it!" : "Whole school progress"}
                      </h2>
                      <p className="mt-3 text-4xl font-extrabold sm:text-5xl">
                        {formatKm(totalKm)} <span className="text-xl">km</span>{" "}
                        <span className="text-base font-normal text-slate-500">
                          completed
                        </span>
                      </p>
                      {totalKm > 7000 && (
                        <p className="text-sm font-bold text-[#FF2BD6] mt-1 animate-pulse">
                          +{formatKm(totalKm - 7000)} km past target!
                        </p>
                      )}
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
                      {challengeComplete ? "We made it! Keep going for your personal target ♡" : "Let’s get to Snehalaya! ♡"}
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
                          {!isStaff && <option>{PLEASE_SELECT}</option>}
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
                          {!isStaff && <option>{PLEASE_SELECT}</option>}
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

              <Card id="my-progress-section" className="scroll-mt-6 rounded-3xl border-slate-200 bg-white shadow-sm">
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
                          {weeklyStreakCount} / {weeklyStreakTarget} days
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {Array.from({ length: weeklyStreakTarget }).map((_, index) => {
                          const achieved = index < weeklyStreakCount;

                          return (
                            <div
                              key={index}
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                achieved
                                  ? "bg-[#FF2BD6] text-white"
                                  : "border-2 border-dashed border-slate-300 text-slate-400"
                              }`}
                            >
                              {achieved ? "✓" : "•"}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {weeklyStreakComplete
                        ? "Weekly streak complete. Keep going!"
                        : `Log activity on ${weeklyStreakRemaining} more day${
                            weeklyStreakRemaining === 1 ? "" : "s"
                          } this week to complete your streak.`}
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
                  <h3 className="font-bold uppercase">My recent entries</h3>
                  {myEntries.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      You have not logged any activity yet.
                    </p>
                  ) : (
                    <div className="mt-3 divide-y divide-slate-100">
                      {myEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                          <div>
                            <p className="text-sm font-bold">{formatKm(entry.km)} km</p>
                            <p className="text-xs text-slate-500">{entry.date}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteOwnEntry(entry.id)}
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex justify-between">
                    <h3 className="font-bold uppercase">Recent activity</h3>
                  </div>
                  {sortedEntries.slice(0, 4).map((entry) => (
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
        ) : isStaff ? (
          <section className="mx-auto mt-4 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-10">
            <div className="grid gap-4 lg:grid-cols-3 items-start">
              <TeacherLeaderboard rows={individualLeaders} title="Individuals" />
              <TeacherLeaderboard rows={groupLeaders} title="Year groups" showAll={true} />
              <div className="space-y-4">
                <TeacherLeaderboard rows={houseLeaders} title="Houses" />
                
                <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <IconBox accent="purple">👥</IconBox>
                        <h3 className="text-lg font-bold text-[#00236C]">Contributors</h3>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Staff only
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3">Year Group</th>
                            <th className="px-4 py-3">Contributors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {groupContributors.map((group) => (
                            <tr key={group.name} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-[#00236C]">
                                {group.name}
                              </td>
                              <td className="px-4 py-3 font-bold text-[#FF2BD6]">
                                {group.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="rounded-3xl border-[#1CFFE3]/40 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Parkrun responses
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-[#00236C]">
                      Victoria Park parkrun
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Saturday 27 June, 9.00 am · Victoria Park, Leicester
                    </p>
                    <button
                      type="button"
                      onClick={refreshParkrunResponses}
                      className="mt-3 rounded-xl border border-[#00236C] bg-white px-3 py-2 text-xs font-bold text-[#00236C] hover:bg-[#F7FAFF]"
                    >
                      Refresh responses
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#EFFFFD] px-5 py-3 text-center">
                    <p className="text-3xl font-black text-[#00236C]">
                      {parkrunAttendees.length}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      I'm in
                    </p>
                  </div>
                </div>

                {parkrunAttendees.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    No one has selected “I'm in!” yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Year group</th>
                          <th className="px-4 py-3">House</th>
                          <th className="px-4 py-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parkrunAttendees.map((attendee) => (
                          <tr key={`${attendee.email}-${attendee.name}`}>
                            <td className="px-4 py-3 font-medium text-[#00236C]">
                              {attendee.name}
                            </td>
                            <td className="px-4 py-3">{attendee.yearGroup}</td>
                            <td className="px-4 py-3">{attendee.house}</td>
                            <td className="px-4 py-3 text-xs">
                              {attendee.email || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">Teacher dashboard</h3>
                  <Button 
                    onClick={handleExportCSV}
                    className="border-[#00236C] bg-white px-4 py-2 text-[#00236C]"
                  >
                    {csvCopied ? "Copied to Clipboard! ✓" : "Export CSV"}
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
                      {sortedEntries.map((entry) => {
                        const isHighEntry = Number(entry.km || 0) > 50;
                        return (
                          <tr 
                            key={entry.id}
                            className={isHighEntry ? "bg-amber-100/80 hover:bg-amber-200/70 transition-colors font-medium" : "hover:bg-slate-50 transition-colors"}
                          >
                            <td className="px-4 py-3 font-medium text-[#00236C]">
                              {entry.name}
                            </td>
                            <td className="px-4 py-3">{entry.group}</td>
                            <td className="px-4 py-3">{entry.house}</td>
                            <td className={`px-4 py-3 ${isHighEntry ? "font-bold text-amber-800" : ""}`}>
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
                                onClick={() => handleDeleteOwnEntry(entry.id)}
                                className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
        ) : null}
      </main>

      <section className="mx-auto mt-4 max-w-7xl px-4 pb-4 sm:px-6 lg:ml-72 lg:px-10">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#00236C]">
                Support Our Snehalaya Partnership
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Families and friends can donate directly to support the work of Snehalaya.
              </p>
            </div>

            <a
              href={DONATION_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-[#FF2BD6] px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-[#D91DB7]"
            >
              Donate to Snehalaya
            </a>
          </CardContent>
        </Card>
      </section>

      <footer className="hidden bg-[#00236C] px-10 py-5 text-sm font-semibold text-white lg:ml-72 lg:flex lg:items-center lg:justify-between">
        <span>LEICESTER HIGH SCHOOL</span>
        <span>Together we can go further</span>
        <span>#LHMovesForSnehalaya ♡</span>
      </footer>

      <MobileNav view={view} setView={setView} scrollToLogForm={scrollToLogForm} isStaff={isStaff} />
    </div>
  );
}
