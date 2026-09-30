"use client";

import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import {
  ListTableStatusBadge,
  type ListTableStatusBadgeProps,
} from "@/components/shared/list-table";

const employeeStatusTone: Record<
  EmployeeItem["status"],
  NonNullable<ListTableStatusBadgeProps["tone"]>
> = {
  Active: "emerald",
  "On Leave": "amber",
  Inactive: "rose",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeItem["status"] }) {
  return <ListTableStatusBadge label={status} tone={employeeStatusTone[status]} />;
}
