export function getListTableInitials(name?: string): string {
  if (!name?.trim()) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
