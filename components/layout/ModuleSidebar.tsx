"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarCheck,
  Users,
  BookOpen,
  UserCheck,
  DoorOpen,
  BedDouble,
  UserCircle,
  FileText,
  CreditCard,
  LogOut,
  Receipt,
  ArrowRightLeft,
  CalendarPlus,
  Bed,
  Tag,
  PieChart,
  Building2,
  ChevronDown,
  ChevronLeft,
  ConciergeBell,
  X,
  Clock,
  UserPlus,
  Luggage,
  Bell,
  Sparkles,
  Wrench,
  PackageSearch,
  MessageSquare,
  Zap,
  Mail,
  History,
  Wallet,
  BarChart3,
  CalendarClock,
  TrendingUp,
  UtensilsCrossed,
  ChefHat,
  Trees,
  PlusCircle,
  ClipboardList,
  AlertTriangle,
  Wine,
  Shield,
  Percent,
  Boxes,
  Layers,
  ShoppingBag,
  PackageCheck,
  ClipboardCheck,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
  Trash2,
  SlidersHorizontal,
  Truck,
  CheckSquare,
  Database,
  Ruler,
  Package,
  ShoppingCart,
  Award,
  FileSpreadsheet,
  CheckCircle2,
  Calculator,
  HelpCircle,
  Star,
  Printer,
  Coins,
  Scale,
  FolderKanban,
  Settings,
  Globe,
  CarTaxiFront,
  Briefcase,
  Sun,
  CalendarHeart,
  CalendarRange,
  FileCog,
  Repeat,
  Calendar,
  Timer,
  CalendarOff,
  Plane,
  GitBranch,
  MessageSquareWarning,
  ListTodo,
  Tags,
  Activity,
  List,
  LogIn,
} from "lucide-react";
import type { ModuleNavItem } from "@/app/data/types";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./MobileNavContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-grid": LayoutGrid,
  "calendar-check": CalendarCheck,
  users: Users,
  "book-open": BookOpen,
  "user-check": UserCheck,
  "door-open": DoorOpen,
  "bed-double": BedDouble,
  "user-circle": UserCircle,
  "file-text": FileText,
  "credit-card": CreditCard,
  "log-out": LogOut,
  receipt: Receipt,
  "arrow-right-left": ArrowRightLeft,
  "calendar-plus": CalendarPlus,
  bed: Bed,
  tag: Tag,
  "pie-chart": PieChart,
  "building-2": Building2,
  globe: Globe,
  clock: Clock,
  "user-plus": UserPlus,
  luggage: Luggage,
  bell: Bell,
  sparkles: Sparkles,
  wrench: Wrench,
  "package-search": PackageSearch,
  "message-square": MessageSquare,
  zap: Zap,
  "car-taxi-front": CarTaxiFront,
  "taxi-booking": CarTaxiFront,
  mail: Mail,
  history: History,
  wallet: Wallet,
  "bar-chart": BarChart3,
  "calendar-clock": CalendarClock,
  "trending-up": TrendingUp,
  utensils: UtensilsCrossed,
  "chef-hat": ChefHat,
  trees: Trees,
  "plus-circle": PlusCircle,
  "clipboard-list": ClipboardList,
  "alert-triangle": AlertTriangle,
  wine: Wine,
  shield: Shield,
  percent: Percent,
  boxes: Boxes,
  layers: Layers,
  "shopping-bag": ShoppingBag,
  "package-check": PackageCheck,
  "clipboard-check": ClipboardCheck,
  "shield-check": ShieldCheck,
  "rotate-ccw": RotateCcw,
  "arrow-up-right": ArrowUpRight,
  "trash-2": Trash2,
  sliders: SlidersHorizontal,
  truck: Truck,
  "check-square": CheckSquare,
  database: Database,
  ruler: Ruler,
  package: Package,
  "shopping-cart": ShoppingCart,
  award: Award,
  "file-spreadsheet": FileSpreadsheet,
  "check-circle": CheckCircle2,
  calculator: Calculator,
  "help-circle": HelpCircle,
  star: Star,
  printer: Printer,
  coins: Coins,
  scale: Scale,
  "folder-kanban": FolderKanban,
  settings: Settings,
  briefcase: Briefcase,
  sun: Sun,
  "calendar-heart": CalendarHeart,
  "calendar-range": CalendarRange,
  "file-cog": FileCog,
  repeat: Repeat,
  calendar: Calendar,
  timer: Timer,
  "calendar-off": CalendarOff,
  plane: Plane,
  "git-branch": GitBranch,
  "message-square-warning": MessageSquareWarning,
  "list-todo": ListTodo,
  tags: Tags,
  activity: Activity,
  list: List,
  "log-in": LogIn,
};

interface ModuleSidebarProps {
  title: string;
  subtitle?: string;
  items: ModuleNavItem[];
}

function isItemActive(pathname: string, href: string) {
  if (href === "/frontoffice/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isParentActive(pathname: string, item: ModuleNavItem) {
  if (isItemActive(pathname, item.href)) return true;
  return item.children?.some((child) => isItemActive(pathname, child.href)) ?? false;
}

function NavTooltip({ label, show }: { label: string; show: boolean }) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!show) {
      setCoords(null);
      return;
    }

    const parent = probeRef.current?.parentElement;
    if (!parent) return;

    const onEnter = () => {
      const rect = parent.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
      });
    };
    const onLeave = () => setCoords(null);

    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [show, label]);

  if (!show) return null;

  return (
    <>
      <span ref={probeRef} className="hidden" aria-hidden />
      {coords &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10"
            style={{ top: coords.top, left: coords.left }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}

function CollapsedChildMenu({
  item,
  pathname,
  onNavigate,
}: {
  item: ModuleNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const showMenu = () => {
    clearClose();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const estimatedHeight = 40 + (item.children?.length ?? 0) * 40;
    const maxTop = window.innerHeight - estimatedHeight - 8;
    setCoords({
      top: Math.max(8, Math.min(rect.top, maxTop)),
      left: rect.right + 8,
    });
    setOpen(true);
  };

  const hideMenu = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => clearClose(), []);

  const Icon = iconMap[item.icon] ?? LayoutGrid;
  const parentActive = isParentActive(pathname, item);

  return (
    <li className="relative">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={showMenu}
        onMouseLeave={hideMenu}
        className={cn(
          "relative flex w-full min-w-0 items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
          parentActive
            ? "bg-emerald-950/70 text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-white",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={item.label}
      >
        <Icon className="h-4 w-4 shrink-0" />
      </button>

      {open &&
        item.children &&
        createPortal(
          <div
            role="menu"
            onMouseEnter={showMenu}
            onMouseLeave={hideMenu}
            className="fixed z-[100] min-w-[13.5rem] overflow-visible rounded-xl border border-slate-700 bg-black py-1.5 shadow-2xl"
            style={{ top: coords.top, left: coords.left }}
          >
            {/* Hover bridge so the cursor can move from icon → menu without closing */}
            <div className="absolute -left-2 top-0 h-full w-2" aria-hidden />
            <p className="border-b border-slate-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <ul className="p-1">
              {item.children.map((child) => {
                const ChildIcon = iconMap[child.icon] ?? LayoutGrid;
                const childActive = isItemActive(pathname, child.href);

                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      role="menuitem"
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        childActive
                          ? "bg-emerald-700 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <ChildIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 leading-snug">{child.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </li>
  );
}

interface SidebarNavProps {
  title: string;
  subtitle: string;
  items: ModuleNavItem[];
  pathname: string;
  isExpanded: boolean;
  showTooltips: boolean;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavigate?: () => void;
  showCollapse?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

function SidebarNav({
  title,
  subtitle,
  items,
  pathname,
  isExpanded,
  showTooltips,
  expandedGroups,
  onToggleGroup,
  onNavigate,
  showCollapse = false,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarNavProps) {
  return (
    <>
      <div
        className={cn(
          "flex items-start gap-2 border-b border-slate-800 py-4",
          isExpanded ? "justify-between px-4" : "justify-center px-2",
        )}
      >
        {isExpanded && (
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700/20 text-emerald-500">
            <ConciergeBell className="h-4 w-4" />
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
        <ul className="min-w-0 space-y-0.5">
          {items.map((item) => {
            const Icon = iconMap[item.icon] ?? LayoutGrid;
            const hasChildren = item.children && item.children.length > 0;
            const parentActive = isParentActive(pathname, item);
            const isGroupExpanded = expandedGroups[item.label] ?? parentActive;

            if (hasChildren) {
              if (showTooltips) {
                return (
                  <CollapsedChildMenu
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                );
              }

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onToggleGroup(item.label)}
                    className={cn(
                      "group/item relative flex w-full min-w-0 items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                      parentActive
                        ? "bg-emerald-950/70 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                      isExpanded ? "gap-2.5 px-3" : "justify-center px-2",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            isGroupExpanded && "rotate-180",
                          )}
                        />
                      </>
                    )}
                  </button>
                  {isExpanded && isGroupExpanded && item.children && (
                    <ul className="ml-3 mt-1 space-y-1 border-l border-slate-700 pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = iconMap[child.icon] ?? LayoutGrid;
                        const childActive = isItemActive(pathname, child.href);

                        return (
                          <li key={`${child.label}-${child.href}`}>
                            <Link
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex min-w-0 items-center gap-2.5 rounded-full px-3 py-2 text-sm transition-colors",
                                childActive
                                  ? "bg-emerald-700 text-white"
                                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="min-w-0 flex-1 leading-snug">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const active = isItemActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group/item relative flex min-w-0 items-center rounded-full py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                    isExpanded ? "gap-2.5 px-3" : "justify-center px-2",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isExpanded && <span className="min-w-0 truncate" title={item.label}>{item.label}</span>}
                  <NavTooltip label={item.label} show={showTooltips} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showCollapse && onToggleCollapse && (
        <div className="hidden border-t border-slate-800 p-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "group/item relative flex w-full items-center rounded-lg py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
              isExpanded ? "gap-2 px-3" : "justify-center px-2",
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                collapsed && "rotate-180",
              )}
            />
            {isExpanded && (
              <span className="truncate">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            )}
            <NavTooltip
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              show={showTooltips}
            />
          </button>
        </div>
      )}
    </>
  );
}

export function ModuleSidebar({ title, subtitle = "Module menu", items }: ModuleSidebarProps) {
  const pathname = usePathname();
  const mobileNav = useMobileNav();
  const [hovered, setHovered] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Masters: true,
    Reports: false,
    Restaurants: true,
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navProps = {
    title,
    subtitle,
    items,
    pathname,
    expandedGroups,
    onToggleGroup: (label: string) => {
      if (mobileNav?.isOpen || hovered) toggleGroup(label);
    },
  };

  return (
    <>
      {/* Mobile drawer */}
      {mobileNav?.isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={mobileNav.close}
            aria-label="Close menu overlay"
          />
          <aside className="sidebar-scroll relative flex h-full w-[min(100vw-3rem,16rem)] max-w-full flex-col overflow-x-hidden bg-black shadow-2xl">
            <SidebarNav
              {...navProps}
              isExpanded
              showTooltips={false}
              onNavigate={mobileNav.close}
              onClose={mobileNav.close}
            />
          </aside>
        </div>
      )}

      {/* Desktop — always collapsed; hover expands as overlapping panel */}
      <aside
        className="relative z-50 hidden h-screen w-16 shrink-0 overflow-visible lg:block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="sidebar-scroll flex h-full flex-col overflow-x-hidden border-r border-slate-800 bg-black">
          <SidebarNav
            {...navProps}
            isExpanded={false}
            showTooltips
          />
        </div>

        <div
          className={cn(
            "sidebar-scroll absolute left-0 top-0 z-50 flex h-full w-72 flex-col overflow-x-hidden border-r border-slate-800 bg-black shadow-2xl transition-[opacity,transform] duration-200 ease-out",
            hovered
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-1 opacity-0",
          )}
          aria-hidden={!hovered}
        >
          <SidebarNav
            {...navProps}
            isExpanded
            showTooltips={false}
          />
        </div>
      </aside>
    </>
  );
}
