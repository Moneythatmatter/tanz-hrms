import { HumanResourcesShell } from "@/components/hr/HumanResourcesShell";

export default function HumanResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HumanResourcesShell>{children}</HumanResourcesShell>;
}
