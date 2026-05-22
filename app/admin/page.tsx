"use client";

import { useEffect, useState, Suspense } from "react";
import AdminHeader from "@/app/components/AdminHeader";

type KPIStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalSessions: number;
  totalPlans: number;
};

type ActivityPoint = {
  date: string;
  users: number;
  sessions: number;
};

type SubjectStat = {
  name: string;
  count: number;
};

type GradeStat = {
  name: string;
  count: number;
};

type AnalyticsData = {
  kpis: KPIStats;
  activity: ActivityPoint[];
  subjects: SubjectStat[];
  grades: GradeStat[];
};

function AdminDashboardContent() {


  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Chart interactivity states
  const [hoveredActivityIdx, setHoveredActivityIdx] = useState<number | null>(null);
  const [hoveredGradeIdx, setHoveredGradeIdx] = useState<number | null>(null);

  // 2. Load analytics data (KPIs and charts) on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await fetch("/api/admin/analytics");
        const resData = await res.json();
        if (res.ok) {
          setAnalyticsData(resData);
        } else {
          setAnalyticsError(resData.error || "Failed to load usage analytics.");
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setAnalyticsError("Failed to load usage analytics.");
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);



  // --- SVG Layout Math for Chart 1: Activity Line & Bar Chart ---
  const activityData = analyticsData?.activity || [];
  const maxSessions = Math.max(...activityData.map((d) => d.sessions), 5);
  const maxUsers = Math.max(...activityData.map((d) => d.users), 5);

  const svgW = 520;
  const svgH = 260;
  const padL = 45;
  const padR = 25;
  const padT = 30;
  const padB = 40;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const getX = (idx: number) => padL + idx * (plotW / 6);
  const getYBar = (val: number) => {
    const h = (val / maxSessions) * plotH;
    return padT + plotH - h;
  };
  const getYLine = (val: number) => {
    const h = (val / maxUsers) * plotH;
    return padT + plotH - h;
  };

  // Generate SVG path for users (purple line)
  const linePoints = activityData.map((pt, idx) => `${getX(idx)},${getYLine(pt.users)}`);
  const linePath = linePoints.length > 0 ? `M ${linePoints.join(" L ")}` : "";

  // Generate SVG area underneath line
  const areaPath = linePoints.length > 0
    ? `${linePath} L ${getX(activityData.length - 1)},${padT + plotH} L ${getX(0)},${padT + plotH} Z`
    : "";

  // --- Donut Chart Math for Chart 3: Grade Level ---
  const totalAnalyticsUsers = analyticsData?.kpis.totalUsers || 0;
  const donutR = 60;
  const donutCX = 90;
  const donutCY = 90;
  const circumference = 2 * Math.PI * donutR;

  const gradeColors = [
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ec4899", // pink
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">
      <AdminHeader />

      <main className="flex-1 lg:pl-64 w-full">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500 text-xs mt-1">
              Analyze platform growth metrics, lesson plan creations, and manage user directories.
            </p>
          </div>

          {/* 1. Top KPI Summary Row */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {analyticsLoading ? (
              // Placeholder skeletons for KPI cards
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 h-28 flex flex-col justify-between"
                >
                  <div className="w-24 h-3 bg-gray-800 rounded" />
                  <div className="w-12 h-7 bg-gray-800 rounded mt-2" />
                  <div className="w-16 h-3 bg-gray-800 rounded mt-1" />
                </div>
              ))
            ) : analyticsError || !analyticsData ? (
              <div className="col-span-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs">
                {analyticsError || "Failed to load metrics."}
              </div>
            ) : (
              [
                {
                  title: "Registered Users",
                  val: analyticsData.kpis.totalUsers,
                  sub: `${analyticsData.kpis.activeUsers} Active`,
                  bg: "bg-blue-600/10 border-blue-500/20 text-blue-400",
                },
                {
                  title: "Total Chat Sessions",
                  val: analyticsData.kpis.totalSessions,
                  sub: "All subjects combined",
                  bg: "bg-indigo-600/10 border-indigo-500/20 text-indigo-400",
                },
                {
                  title: "Plans Generated",
                  val: analyticsData.kpis.totalPlans,
                  sub: `${((analyticsData.kpis.totalPlans / Math.max(analyticsData.kpis.totalSessions, 1)) * 100).toFixed(0)}% conversion rate`,
                  bg: "bg-purple-600/10 border-purple-500/20 text-purple-400",
                },
                {
                  title: "Suspended Accounts",
                  val: analyticsData.kpis.suspendedUsers,
                  sub: `${((analyticsData.kpis.suspendedUsers / Math.max(analyticsData.kpis.totalUsers, 1)) * 100).toFixed(1)}% suspension rate`,
                  bg: "bg-red-600/10 border-red-500/20 text-red-400",
                },
                {
                  title: "Active Tutors",
                  val: analyticsData.subjects.length,
                  sub: "Active prompt templates",
                  bg: "bg-emerald-600/10 border-emerald-500/20 text-emerald-400",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex flex-col justify-between h-28 hover:border-gray-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 text-xs font-medium">{card.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${card.bg}`}>
                      Active
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white mt-1">
                      {card.val}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{card.sub}</div>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* 2. Visualizations row */}
          {analyticsLoading ? (
            // Skeletal placeholder for the chart blocks
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 h-[348px] animate-pulse flex flex-col gap-4">
                <div className="w-1/3 h-5 bg-gray-800 rounded" />
                <div className="w-full h-full bg-gray-950/40 rounded border border-gray-800/30" />
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-[348px] animate-pulse flex flex-col justify-between">
                <div className="w-1/2 h-5 bg-gray-800 rounded" />
                <div className="w-32 h-32 rounded-full border border-gray-800 mx-auto" />
                <div className="space-y-2 mt-4">
                  <div className="w-full h-3 bg-gray-800 rounded" />
                  <div className="w-full h-3 bg-gray-800 rounded" />
                </div>
              </div>
            </div>
          ) : analyticsError || !analyticsData ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-xs">
              No analytics overview statistics available.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart A: System Activity Trends */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-semibold text-white">System Activity Trends</h2>
                      <p className="text-[10px] text-gray-500">Daily chat sessions and registrations (last 7 days)</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 bg-blue-500/60 rounded-sm" />
                        <span className="text-gray-400">Sessions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-purple-500" />
                        <span className="text-gray-400">Signups</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full h-[260px] select-none bg-gray-950/40 rounded-lg p-2 border border-gray-800/30">
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      width="100%"
                      height="100%"
                      className="overflow-visible"
                    >
                      <defs>
                        <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Gridlines */}
                      {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                        const y = padT + plotH * ratio;
                        return (
                          <line
                            key={ratio}
                            x1={padL}
                            y1={y}
                            x2={padL + plotW}
                            y2={y}
                            stroke="rgba(255,255,255,0.04)"
                            strokeWidth={1}
                          />
                        );
                      })}

                      {/* Dates */}
                      {activityData.map((pt, idx) => {
                        const x = getX(idx);
                        return (
                          <g key={idx}>
                            <line
                              x1={x}
                              y1={padT + plotH}
                              x2={x}
                              y2={padT + plotH + 4}
                              stroke="rgba(255,255,255,0.15)"
                            />
                            <text
                              x={x}
                              y={padT + plotH + 16}
                              textAnchor="middle"
                              className="text-[9px] fill-gray-500 font-medium"
                            >
                              {pt.date}
                            </text>
                          </g>
                        );
                      })}

                      {/* Left Y Axis (Sessions) */}
                      <g>
                        {[0, 0.5, 1.0].map((ratio) => {
                          const y = padT + plotH * (1 - ratio);
                          const val = Math.round(maxSessions * ratio);
                          return (
                            <text
                              key={ratio}
                              x={padL - 8}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[9px] fill-blue-400 font-semibold"
                            >
                              {val}
                            </text>
                          );
                        })}
                        <text
                          x={padL - 10}
                          y={padT - 10}
                          textAnchor="middle"
                          className="text-[8px] fill-blue-500 font-bold uppercase tracking-wider"
                        >
                          Sessions
                        </text>
                      </g>

                      {/* Right Y Axis (Signups) */}
                      <g>
                        {[0, 0.5, 1.0].map((ratio) => {
                          const y = padT + plotH * (1 - ratio);
                          const val = Math.round(maxUsers * ratio);
                          return (
                            <text
                              key={ratio}
                              x={padL + plotW + 8}
                              y={y + 3}
                              textAnchor="start"
                              className="text-[9px] fill-purple-400 font-semibold"
                            >
                              {val}
                            </text>
                          );
                        })}
                        <text
                          x={padL + plotW + 10}
                          y={padT - 10}
                          textAnchor="middle"
                          className="text-[8px] fill-purple-500 font-bold uppercase tracking-wider"
                        >
                          Signups
                        </text>
                      </g>

                      {/* Bars for Sessions */}
                      {activityData.map((pt, idx) => {
                        const x = getX(idx);
                        const y = getYBar(pt.sessions);
                        const h = padT + plotH - y;
                        return (
                          <rect
                            key={idx}
                            x={x - 9}
                            y={y}
                            width={18}
                            height={Math.max(h, 2)}
                            rx={3}
                            fill="rgba(59, 130, 246, 0.45)"
                            className="transition-all duration-300 hover:fill-blue-500/80 cursor-pointer"
                          />
                        );
                      })}

                      {/* Area for Signups */}
                      {areaPath && (
                        <path d={areaPath} fill="url(#purpleAreaGrad)" className="pointer-events-none" />
                      )}

                      {/* Line path for Signups */}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth={2.5}
                          className="pointer-events-none drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]"
                        />
                      )}

                      {/* Dots */}
                      {activityData.map((pt, idx) => {
                        const x = getX(idx);
                        const y = getYLine(pt.users);
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r={3.5}
                            fill="#1e1b4b"
                            stroke="#c084fc"
                            strokeWidth={1.5}
                            className="pointer-events-none"
                          />
                        );
                      })}

                      {/* Interactivity overlay columns */}
                      {activityData.map((pt, idx) => {
                        const x = getX(idx);
                        const colW = plotW / 6;
                        return (
                          <rect
                            key={idx}
                            x={x - colW / 2}
                            y={padT}
                            width={colW}
                            height={plotH}
                            fill="transparent"
                            className="cursor-crosshair"
                            onMouseEnter={() => setHoveredActivityIdx(idx)}
                            onMouseLeave={() => setHoveredActivityIdx(null)}
                          />
                        );
                      })}

                      {/* Interactive Tooltip Card */}
                      {hoveredActivityIdx !== null && (
                        <g className="pointer-events-none">
                          <line
                            x1={getX(hoveredActivityIdx)}
                            y1={padT}
                            x2={getX(hoveredActivityIdx)}
                            y2={padT + plotH}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth={1}
                            strokeDasharray="3,3"
                          />
                          <g
                            transform={`translate(${
                              getX(hoveredActivityIdx) > svgW / 2
                                ? getX(hoveredActivityIdx) - 120
                                : getX(hoveredActivityIdx) + 12
                            }, 40)`}
                          >
                            <rect
                              width={105}
                              height={64}
                              rx={6}
                              fill="#111827"
                              stroke="#374151"
                              strokeWidth={1.5}
                              className="shadow-2xl"
                            />
                            <text
                              x={10}
                              y={18}
                              className="text-[9px] fill-gray-400 font-bold tracking-wider"
                            >
                              {activityData[hoveredActivityIdx].date}
                            </text>
                            <text x={10} y={35} className="text-[10px] fill-blue-400 font-bold">
                              Sessions: {activityData[hoveredActivityIdx].sessions}
                            </text>
                            <text x={10} y={50} className="text-[10px] fill-purple-400 font-bold">
                              Signups: {activityData[hoveredActivityIdx].users}
                            </text>
                          </g>
                        </g>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Chart B: Grade Distribution Donut */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Audience Distribution</h2>
                    <p className="text-[10px] text-gray-500">Breakdown of student grade levels</p>
                  </div>

                  <div className="flex flex-col items-center gap-6 mt-4 mb-2">
                    <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 180 180" width="100%" height="100%" className="overflow-visible">
                        <circle
                          cx={donutCX}
                          cy={donutCY}
                          r={donutR}
                          fill="transparent"
                          stroke="#1f2937"
                          strokeWidth={14}
                        />

                        {analyticsData.grades.map((item, idx) => {
                          const percentage = totalAnalyticsUsers > 0 ? item.count / totalAnalyticsUsers : 0;
                          const strokeLength = percentage * circumference;

                          const cumulativeBefore = analyticsData.grades
                            .slice(0, idx)
                            .reduce((sum, g) => sum + (totalAnalyticsUsers > 0 ? g.count / totalAnalyticsUsers : 0), 0);
                          const strokeOffset = -(cumulativeBefore * circumference);

                          const color = gradeColors[idx % gradeColors.length];
                          const isHovered = hoveredGradeIdx === idx;

                          return (
                            <circle
                              key={idx}
                              cx={donutCX}
                              cy={donutCY}
                              r={donutR}
                              fill="transparent"
                              stroke={color}
                              strokeWidth={isHovered ? 18 : 14}
                              strokeDasharray={`${strokeLength} ${circumference}`}
                              strokeDashoffset={strokeOffset}
                              transform="rotate(-90 90 90)"
                              className="transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredGradeIdx(idx)}
                              onMouseLeave={() => setHoveredGradeIdx(null)}
                            />
                          );
                        })}

                        <g className="pointer-events-none">
                          <text
                            x={donutCX}
                            y={donutCY - 6}
                            textAnchor="middle"
                            className="text-[10px] fill-gray-500 font-bold uppercase tracking-wider"
                          >
                            Total Users
                          </text>
                          <text
                            x={donutCX}
                            y={donutCY + 12}
                            textAnchor="middle"
                            className="text-xl fill-white font-extrabold"
                          >
                            {totalAnalyticsUsers}
                          </text>
                        </g>
                      </svg>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 w-full">
                      {analyticsData.grades.map((item, idx) => {
                        const percentage = totalAnalyticsUsers > 0 ? (item.count / totalAnalyticsUsers) * 100 : 0;
                        const color = gradeColors[idx % gradeColors.length];
                        const isHovered = hoveredGradeIdx === idx;

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border transition ${
                              isHovered
                                ? "bg-gray-800/60 border-gray-700"
                                : "border-transparent bg-transparent"
                            }`}
                            onMouseEnter={() => setHoveredGradeIdx(idx)}
                            onMouseLeave={() => setHoveredGradeIdx(null)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-[10px] text-gray-300 font-medium truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-right shrink-0">
                              <span className="text-white font-bold">{item.count}</span>{" "}
                              <span className="text-gray-500">({percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Popularity progress tracks */}
              <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div>
                  <h2 className="text-sm font-semibold text-white">Subject Popularity</h2>
                  <p className="text-[10px] text-gray-500">Cumulative chat sessions created per subject</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-6">
                  {analyticsData.subjects.length > 0 ? (
                    analyticsData.subjects.map((subj, idx) => {
                      const maxCount = Math.max(...analyticsData.subjects.map((s) => s.count), 1);
                      const percent = (subj.count / maxCount) * 100;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-300">{subj.name}</span>
                            <span className="text-blue-400 font-bold">{subj.count} sessions</span>
                          </div>
                          <div className="h-2.5 bg-gray-950 border border-gray-800/80 rounded-full overflow-hidden w-full">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-500 text-xs py-4 md:col-span-2 text-center">
                      No active session data recorded.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}