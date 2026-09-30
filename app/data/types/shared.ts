export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
}

export interface ModuleNavItem {
  label: string;
  href: string;
  icon: string;
  children?: ModuleNavItem[];
}
