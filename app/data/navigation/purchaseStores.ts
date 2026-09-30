import type { ModuleNavItem } from "../types";

export const purchaseStoresNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/purchase-stores/dashboard", icon: "layout-grid" },
  {
    label: "Procurement",
    href: "/purchase-stores/procurement",
    icon: "shopping-bag",
    children: [
      { label: "Requisitions", href: "/purchase-stores/procurement/requisitions", icon: "file-text" },
      { label: "RFQs", href: "/purchase-stores/procurement/rfq", icon: "file-spreadsheet" },
      { label: "Vendors", href: "/purchase-stores/vendors", icon: "users" },
      { label: "Purchase Orders", href: "/purchase-stores/procurement/orders", icon: "shopping-cart" },
      { label: "Direct Purchases", href: "/purchase-stores/procurement/dsp", icon: "zap" },
      // V1: hidden — keep route /procurement/contracts
      // { label: "Rate Contracts", href: "/purchase-stores/procurement/contracts", icon: "award" },
      // V1: hidden — keep route /procurement/invoice-matching (future work queue)
      // { label: "Invoice Matching", href: "/purchase-stores/procurement/invoice-matching", icon: "check-circle" },
    ],
  },
  {
    label: "Receiving & Quality",
    href: "/purchase-stores/receiving",
    icon: "package-check",
    children: [
      { label: "Goods Receipt", href: "/purchase-stores/receiving/grn", icon: "clipboard-check" },
      { label: "QC Inspection", href: "/purchase-stores/receiving/inspection", icon: "shield-check" },
      { label: "Vendor Returns", href: "/purchase-stores/receiving/returns", icon: "rotate-ccw" },
    ],
  },
  {
    label: "Inventory",
    href: "/purchase-stores/inventory",
    icon: "boxes",
    children: [
      { label: "Stock", href: "/purchase-stores/inventory/stock", icon: "layers" },
      // V1: movement history accessed from Stock detail — keep route /inventory/ledger
      { label: "Issues", href: "/purchase-stores/inventory/issues", icon: "arrow-up-right" },
      { label: "Transfers", href: "/purchase-stores/inventory/transfers", icon: "arrow-right-left" },
      { label: "Par Stock", href: "/purchase-stores/inventory/par-stock", icon: "sliders" },
      { label: "Adjustments", href: "/purchase-stores/inventory/adjustments", icon: "sliders" },
      { label: "Warehouses", href: "/purchase-stores/inventory/warehouses", icon: "building-2" },
      // V1: hidden — keep route /inventory/batch-fefo (access from Stock detail when needed)
    ],
  },
  {
    label: "Masters",
    href: "/purchase-stores/masters",
    icon: "database",
    children: [
      { label: "Units", href: "/purchase-stores/masters/units", icon: "ruler" },
      { label: "Categories", href: "/purchase-stores/masters/categories", icon: "layers" },
      { label: "Products / Materials", href: "/purchase-stores/masters/products", icon: "package" },
    ],
  },
  {
    label: "Reports",
    href: "/purchase-stores/reports",
    icon: "bar-chart",
    children: [
      { label: "Stock Register", href: "/purchase-stores/reports/stock-register", icon: "file-text" },
      { label: "Purchases", href: "/purchase-stores/reports/purchases", icon: "shopping-bag" },
      { label: "Issues", href: "/purchase-stores/reports/issues", icon: "arrow-up-right" },
      { label: "Par Stock", href: "/purchase-stores/reports/par-stock", icon: "sliders" },
      { label: "Spoilage", href: "/purchase-stores/reports/spoilage", icon: "alert-triangle" },
      { label: "Purchase Orders", href: "/purchase-stores/reports/orders", icon: "shopping-cart" },
      { label: "Returns", href: "/purchase-stores/reports/returns", icon: "rotate-ccw" },
    ],
  },
  {
    label: "Settings",
    href: "/purchase-stores/settings",
    icon: "settings",
  },
];
