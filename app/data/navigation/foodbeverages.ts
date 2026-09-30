import type { ModuleNavItem } from "../types";

export const foodBeveragesNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/food-beverages/dashboard", icon: "layout-grid" },
  {
    label: "Restaurants",
    href: "/food-beverages/restaurants",
    icon: "utensils",
    children: [
      { label: "Outlets", href: "/food-beverages/restaurants/outlets", icon: "building-2" },
      { label: "Tables", href: "/food-beverages/restaurants/tables", icon: "layout-grid" },
      { label: "Reservations", href: "/food-beverages/restaurants/reservations", icon: "calendar-check" },
      { label: "Orders", href: "/food-beverages/restaurants/orders", icon: "clipboard-list" },
      { label: "All Orders", href: "/food-beverages/restaurants/all-orders", icon: "history" },
      { label: "Bills", href: "/food-beverages/restaurants/bills", icon: "receipt" },
      { label: "Kitchen", href: "/food-beverages/kitchen/orders", icon: "chef-hat" },
      { label: "Cashier", href: "/food-beverages/restaurants/cashier", icon: "wallet" },
      { label: "Day Close", href: "/food-beverages/restaurants/day-close", icon: "calendar-clock" },
    ],
  },
  {
    label: "Masters",
    href: "/food-beverages/masters",
    icon: "database",
    children: [
      { label: "Units", href: "/food-beverages/masters/units", icon: "ruler" },
      { label: "Tax Groups", href: "/food-beverages/masters/tax-groups", icon: "percent" },
      { label: "Modifier Groups", href: "/food-beverages/masters/modifier-groups", icon: "plus-circle" },
      { label: "Outlet Types", href: "/food-beverages/masters/outlet-types", icon: "building-2" },
    ],
  },
  {
    label: "Menu",
    href: "/food-beverages/menu",
    icon: "book-open",
    children: [
      { label: "Categories", href: "/food-beverages/menu/categories", icon: "tag" },
      { label: "Items", href: "/food-beverages/menu/items", icon: "utensils" },
      { label: "Modifiers", href: "/food-beverages/menu/modifiers", icon: "plus-circle" },
      { label: "Recipes", href: "/food-beverages/menu/recipes", icon: "file-text" },
    ],
  },
  {
    label: "Inventory",
    href: "/food-beverages/inventory",
    icon: "package-search",
    children: [
      { label: "Ingredients", href: "/food-beverages/inventory/ingredients", icon: "utensils" },
      { label: "Wastage", href: "/food-beverages/inventory/wastage", icon: "alert-triangle" },
      { label: "Adjustments", href: "/food-beverages/inventory/adjustments", icon: "percent" },
    ],
  },
  { label: "POS Billing", href: "/food-beverages/pos-billing", icon: "receipt" },
  {
    label: "Reports",
    href: "/food-beverages/reports",
    icon: "bar-chart",
    children: [
      { label: "Daily Sales", href: "/food-beverages/reports/daily-sales", icon: "trending-up" },
      { label: "Item Sales", href: "/food-beverages/reports/item-sales", icon: "utensils" },
      { label: "Category Sales", href: "/food-beverages/reports/category-sales", icon: "pie-chart" },
      { label: "Outlet Sales", href: "/food-beverages/reports/outlet-sales", icon: "building-2" },
      { label: "Cashier", href: "/food-beverages/reports/cashier", icon: "wallet" },
      { label: "Table Turnover", href: "/food-beverages/reports/table-turnover", icon: "layout-grid" },
      { label: "Food Cost", href: "/food-beverages/reports/food-cost", icon: "percent" },
      { label: "Inventory", href: "/food-beverages/reports/inventory", icon: "package-search" },
      { label: "Kitchen Performance", href: "/food-beverages/reports/kitchen-performance", icon: "chef-hat" },
      { label: "Cancelled Bills", href: "/food-beverages/reports/cancelled-bills", icon: "alert-triangle" },
      { label: "Discount Report", href: "/food-beverages/reports/discount", icon: "tag" },
    ],
  },
];
