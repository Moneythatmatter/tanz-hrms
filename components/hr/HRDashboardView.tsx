"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CalendarOff,
  Wallet,
  UserPlus,
  Clock,
  CheckCircle2,
  Building2,
  Gift,
  Award,
  Calendar,
  MessageSquareWarning,
  ArrowRight,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ModulePageShell } from "@/components/pms";
import type { SummaryStat } from "@/app/data/types";
import {
  departmentChartColors,
  PendingLeaveItem,
  type HRKpiSummary,
  type GrievanceSummary,
  type DepartmentHeadcount,
  type AttendanceBreakdown,
  type HRWeeklyAttendancePoint,
  type DesignationHeadcount,
  type GenderDistribution,
  type HRActivityItem,
  type EmployeeEventItem,
  type HolidayShiftItem,
} from "@/app/data/hr/hrDashboardData";
import { hrDashboardService, hrLeaveApplicationService } from "@/services/human-resources";
import { mapDashboardFromApi, mapLeaveApplicationFromApi } from "@/lib/hr/api-mappers";
import { cn } from "@/lib/utils";

function PanelCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Card>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-center">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}

function ListRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-slate-100 bg-white px-3 py-2.5", className)}>
      {children}
    </div>
  );
}

const activityDotColors: Record<string, string> = {
  join: "bg-sky-500",
  leave: "bg-emerald-500",
  attendance: "bg-amber-500",
  payroll: "bg-violet-500",
  grievance: "bg-rose-500",
};

export function HRDashboardView() {
  const router = useRouter();
  const [kpiSummary, setKpiSummary] = useState<HRKpiSummary>({
    totalEmployees: 0,
    newJoineesThisMonth: 0,
    presentCount: 0,
    totalShiftStaff: 0,
    attendanceRate: 0,
    onLeaveCount: 0,
    pendingLeaveRequestsCount: 0,
    payrollProcessedCount: 0,
    payrollPendingCount: 0,
    payCycleDate: "—",
  });
  const [grievanceSummary, setGrievanceSummary] = useState<GrievanceSummary>({
    open: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
  });
  const [departmentHeadcounts, setDepartmentHeadcounts] = useState<DepartmentHeadcount[]>([]);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState<AttendanceBreakdown>({
    present: 0,
    absent: 0,
    onLeave: 0,
    lateArrivals: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<HRWeeklyAttendancePoint[]>([]);
  const [designationHeadcounts, setDesignationHeadcounts] = useState<DesignationHeadcount[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution>({
    male: 0,
    female: 0,
    other: 0,
    total: 0,
  });
  const [activities, setActivities] = useState<HRActivityItem[]>([]);
  const [events, setEvents] = useState<EmployeeEventItem[]>([]);
  const [holidaysAndShifts, setHolidaysAndShifts] = useState<HolidayShiftItem[]>([]);
  const [leavesList, setLeavesList] = useState<PendingLeaveItem[]>([]);
  const [selectedDesigDept, setSelectedDesigDept] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashData, leaveRows] = await Promise.all([
          hrDashboardService.get(),
          hrLeaveApplicationService.list(),
        ]);
        const mapped = mapDashboardFromApi(dashData);
        setKpiSummary(mapped.kpiSummary);
        setDepartmentHeadcounts(
          mapped.deptHeadcounts.map((d) => ({
            ...d,
            color: departmentChartColors[d.department] ?? "#64748b",
          })),
        );
        setGrievanceSummary(mapped.grievanceSummary);
        setAttendanceBreakdown(mapped.attendanceBreakdown);
        setWeeklyTrend(mapped.weeklyTrend);
        setDesignationHeadcounts(mapped.designationHeadcounts);
        setGenderDistribution(mapped.genderDistribution);
        setEvents(mapped.events);
        setHolidaysAndShifts(mapped.holidaysAndShifts);
        setActivities(mapped.activities);
        const pendingLeaves = leaveRows
          .filter((row) => String(row.status) === "Pending")
          .map((row) => {
            const app = mapLeaveApplicationFromApi(row);
            return {
              id: app.id,
              employeeName: app.employeeName,
              avatar: app.avatar,
              department: app.department,
              leaveType: app.leaveTypeName,
              fromDate: app.fromDate,
              toDate: app.toDate,
              days: app.totalDays,
              reason: app.reason,
            } satisfies PendingLeaveItem;
          });
        setLeavesList(pendingLeaves);
      } catch (e) {
        setToastMessage(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    };
    void loadDashboard();
  }, []);

  const handleApproveLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Approved leave request for ${name}.`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setLeavesList((prev) => prev.filter((item) => item.id !== id));
    setToastMessage(`Rejected leave request for ${name}.`);
  };

  const kpiStats: SummaryStat[] = useMemo(
    () => [
      {
        title: "Total Employees",
        value: String(kpiSummary.totalEmployees),
        change: `+${kpiSummary.newJoineesThisMonth} this month`,
        trend: "up",
      },
      {
        title: "Pending Leave",
        value: String(kpiSummary.pendingLeaveRequestsCount),
        change: "Awaiting approval",
        trend: "down",
      },
      {
        title: "Open Grievances",
        value: String(grievanceSummary.open),
        change: `${grievanceSummary.escalated} escalated`,
        trend: "down",
      },
      {
        title: "Payroll Processed",
        value: String(kpiSummary.payrollProcessedCount),
        change: `${kpiSummary.payrollPendingCount} pending`,
        trend: "up",
      },
    ],
    [kpiSummary, grievanceSummary],
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartWeeklyTrend = useMemo(() => {
    if (weeklyTrend && weeklyTrend.length > 0) return weeklyTrend;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      present: kpiSummary.presentCount || 0,
    }));
  }, [weeklyTrend, kpiSummary.presentCount]);

  const departmentChartData = useMemo(() => {
    if (departmentHeadcounts && departmentHeadcounts.length > 0) {
      return departmentHeadcounts.map((dept) => ({
        name: dept.department,
        count: dept.count,
        fill: dept.color || (departmentChartColors[dept.department] ?? "#16a34a"),
      }));
    }
    return [
      { name: "Front Office", count: 0, fill: "#2563eb" },
      { name: "Housekeeping", count: 0, fill: "#16a34a" },
      { name: "Food & Beverage", count: 0, fill: "#ea580c" },
      { name: "Human Resources", count: 0, fill: "#8b5cf6" },
    ];
  }, [departmentHeadcounts]);

  const filteredDesignations = useMemo(
    () =>
      designationHeadcounts.filter(
        (desig) => selectedDesigDept === "All" || desig.department === selectedDesigDept,
      ),
    [designationHeadcounts, selectedDesigDept],
  );

  const totalStaff = kpiSummary.totalEmployees;
  const onShiftTotal = Math.max(
    attendanceBreakdown.present +
      attendanceBreakdown.absent +
      attendanceBreakdown.onLeave +
      attendanceBreakdown.lateArrivals,
    totalStaff,
  );
  const pct = (n: number) =>
    onShiftTotal > 0 ? `${Math.round((n / onShiftTotal) * 1000) / 10}%` : "0%";

  return (
    <ModulePageShell
      eyebrow="Human Resource Module"
      title="Human Resource Dashboard"
      breadcrumbs={[{ label: "Human Resource", href: "/human-resources/dashboard" }, { label: "Dashboard" }]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      primaryAction={{
        label: "Add Employee",
        onClick: () => router.push("/human-resources/employees/add"),
      }}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/human-resources/attendance-leave/attendance">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Mark Attendance
            </Button>
          </a>
          <a href="/human-resources/attendance-leave/leave-management">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Approve Leaves
            </Button>
          </a>
        </div>
      }
    >
      <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {kpiStats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <PanelCard
              title="Attendance overview"
              subtitle="Today's shift headcount across operational departments"
              action={
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  {kpiSummary.presentCount} / {totalStaff} active
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricTile label="Present" value={attendanceBreakdown.present} detail={`${pct(attendanceBreakdown.present)} on shift`} />
                <MetricTile label="Absent" value={attendanceBreakdown.absent} detail={`${pct(attendanceBreakdown.absent)} unexcused`} />
                <MetricTile label="On leave" value={attendanceBreakdown.onLeave} detail={`${pct(attendanceBreakdown.onLeave)} approved`} />
                <MetricTile label="Late arrivals" value={attendanceBreakdown.lateArrivals} detail="Within grace" />
              </div>

              <div className="mt-4 h-44 sm:h-48 min-h-[176px] w-full min-w-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                    <AreaChart data={chartWeeklyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hrAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={28} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fill="url(#hrAttendanceFill)"
                        dot={{ fill: "#16a34a", r: 2.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse" />
                )}
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                  <span>Shift distribution</span>
                  <span>{kpiSummary.presentCount} on duty</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  {onShiftTotal > 0 ? (
                    <>
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(attendanceBreakdown.present / onShiftTotal) * 100}%` }}
                      />
                      <div
                        className="bg-rose-400"
                        style={{ width: `${(attendanceBreakdown.absent / onShiftTotal) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400"
                        style={{ width: `${(attendanceBreakdown.onLeave / onShiftTotal) * 100}%` }}
                      />
                      <div
                        className="bg-sky-400"
                        style={{ width: `${(attendanceBreakdown.lateArrivals / onShiftTotal) * 100}%` }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </PanelCard>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <PanelCard title="Department headcount" subtitle="Staff allocation by department">
              <div className="h-52 sm:h-56 min-h-[208px] w-full min-w-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <BarChart data={departmentChartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        width={92}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                        {departmentChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-xl bg-slate-50 animate-pulse" />
                )}
              </div>
            </PanelCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <PanelCard
              title="Employee count by designation"
              subtitle="Role-wise staffing across hotel operations"
              action={
                <a
                  href="/human-resources/masters/designations"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </a>
              }
            >
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDesigDept("All")}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    selectedDesigDept === "All"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  All ({totalStaff})
                </button>
                {Array.from(new Set(designationHeadcounts.map((d) => d.department))).map((dept) => {
                  const deptCount = designationHeadcounts
                    .filter((d) => d.department === dept)
                    .reduce((acc, curr) => acc + curr.count, 0);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDesigDept(dept)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        selectedDesigDept === dept
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {dept} ({deptCount})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {filteredDesignations.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No designation data yet.</p>
                ) : (
                  filteredDesignations.map((desig) => {
                  const percentage = totalStaff > 0 ? Math.round((desig.count / totalStaff) * 100) : 0;
                  return (
                    <div key={desig.designation} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{desig.designation}</p>
                          <p className="text-[10px] text-slate-400">{desig.department}</p>
                        </div>
                        <span className="shrink-0 font-semibold text-slate-900">
                          {desig.count}
                          <span className="ml-1 font-normal text-slate-400">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", desig.color)}
                          style={{ width: `${totalStaff > 0 ? (desig.count / totalStaff) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </PanelCard>
          </div>

          <div className="min-w-0 lg:col-span-5">
            {(() => {
              const genderTotal = genderDistribution.total || 0;
              const malePct = genderTotal > 0 ? Math.round((genderDistribution.male / genderTotal) * 100) : 0;
              const femalePct = genderTotal > 0 ? Math.round((genderDistribution.female / genderTotal) * 100) : 0;
              const otherPct = genderTotal > 0 ? Math.round((genderDistribution.other / genderTotal) * 100) : 0;

              return (
                <PanelCard
                  title="Gender distribution"
                  subtitle="Active workforce diversity breakdown"
                  action={
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {genderTotal} total
                    </span>
                  }
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Gender ratio</span>
                        <span>
                          {malePct}% male · {femalePct}% female{otherPct > 0 ? ` · ${otherPct}% other` : ""}
                        </span>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="bg-slate-700"
                          style={{ width: `${genderTotal > 0 ? (genderDistribution.male / genderTotal) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-slate-400"
                          style={{ width: `${genderTotal > 0 ? (genderDistribution.female / genderTotal) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-slate-300"
                          style={{ width: `${genderTotal > 0 ? (genderDistribution.other / genderTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <MetricTile
                        label="Male"
                        value={genderDistribution.male}
                        detail={`${malePct}%`}
                      />
                      <MetricTile
                        label="Female"
                        value={genderDistribution.female}
                        detail={`${femalePct}%`}
                      />
                      <MetricTile
                        label="Other"
                        value={genderDistribution.other}
                        detail={`${otherPct}%`}
                      />
                    </div>
                  </div>
                </PanelCard>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <PanelCard
              title="Pending leave requests"
              subtitle={`${leavesList.length} awaiting approval`}
              action={
                <a
                  href="/human-resources/attendance-leave/leave-management"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </a>
              }
            >
              <div className="space-y-2.5">
                {leavesList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No pending leave requests.</p>
                ) : (
                  leavesList.map((leave) => (
                    <ListRow key={leave.id} className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                          {leave.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{leave.employeeName}</p>
                          <p className="text-xs text-slate-500">
                            {leave.department} · {leave.leaveType}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-700">
                          {leave.fromDate} – {leave.toDate} ({leave.days}d)
                        </p>
                        <p className="text-[11px] text-slate-400">{leave.reason}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApproveLeave(leave.id, leave.employeeName)}
                          className="h-7 rounded-lg bg-emerald-700 px-2.5 text-[11px] font-semibold hover:bg-emerald-800"
                        >
                          <Check className="mr-0.5 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectLeave(leave.id, leave.employeeName)}
                          className="h-7 rounded-lg border-slate-200 px-2.5 text-[11px] font-medium"
                        >
                          <X className="mr-0.5 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </ListRow>
                  ))
                )}
              </div>
            </PanelCard>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <PanelCard title="Recent HR activities" subtitle="Live updates from HR operations">
              <ul className="space-y-4">
                {activities.map((act) => (
                  <li key={act.id} className="flex gap-3">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", activityDotColors[act.type])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{act.title}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{act.timeAgo}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{act.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <PanelCard title="Birthdays & work anniversaries" subtitle="Upcoming celebrations">
            <div className="space-y-2.5">
              {events.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No upcoming celebrations.</p>
              ) : (
                events.map((ev) => (
                  <ListRow key={ev.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-xs",
                          ev.type === "birthday"
                            ? "bg-pink-100/90 text-pink-700 border border-pink-200/60"
                            : "bg-indigo-100/90 text-indigo-700 border border-indigo-200/60",
                        )}
                      >
                        {ev.type === "birthday" ? (
                          <Gift className="h-4 w-4 text-pink-600" />
                        ) : (
                          <Award className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{ev.name}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              ev.type === "birthday"
                                ? "bg-pink-50 text-pink-700 border border-pink-200/70"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200/70",
                            )}
                          >
                            {ev.type === "birthday"
                              ? "🎂 Birthday"
                              : `🎉 ${ev.years === 1 ? "1st" : `${ev.years}th`} Work Anniversary`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{ev.department}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {ev.date}
                    </span>
                  </ListRow>
                ))
              )}
            </div>
          </PanelCard>

          <PanelCard title="Holidays & shift exceptions" subtitle="Upcoming schedule changes">
            <div className="space-y-2.5">
              {holidaysAndShifts.map((hs) => (
                <ListRow key={hs.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{hs.title}</p>
                    <p className="text-xs text-slate-500">{hs.date}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
                      hs.type === "holiday"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-violet-50 text-violet-700",
                    )}
                  >
                    {hs.badgeText}
                  </span>
                </ListRow>
              ))}
            </div>
          </PanelCard>
        </div>

        <PanelCard
          title="Grievance summary"
          subtitle="Complaint status overview"
          action={
            <a
              href="/human-resources/grievances/complaint-list"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Grievance portal
              <ArrowRight className="h-3 w-3" />
            </a>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricTile label="Open" value={grievanceSummary.open} detail="Needs HR review" />
            <MetricTile label="In progress" value={grievanceSummary.inProgress} detail="Under investigation" />
            <MetricTile label="Escalated" value={grievanceSummary.escalated} detail="Management review" />
            <MetricTile label="Resolved" value={grievanceSummary.resolved} detail="Closed this year" />
          </div>
        </PanelCard>
      </div>
    </ModulePageShell>
  );
}
