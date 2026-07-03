import type { ColumnDef } from "@tanstack/react-table";
import type { LogRow } from "@/features/dashboard-logs/api/view-model";
import { SeverityBadge } from "../severity-badge/severity-badge";
import styles from "./log-columns.module.css";

export const logColumns: ColumnDef<LogRow>[] = [
  {
    accessorKey: "severityBand",
    header: "Severity",
    meta: { fixedWidth: 128 },
    cell: ({ row }) => (
      <SeverityBadge
        band={row.original.severityBand}
        label={row.original.severityLabel}
      />
    ),
  },
  {
    accessorKey: "timestampMs",
    header: "Time",
    meta: { fixedWidth: 104 },
    cell: ({ row }) => row.original.time,
  },
  {
    accessorKey: "body",
    header: "Body",
    cell: ({ row }) => (
      <span className={styles.truncatedBody}>{row.original.body}</span>
    ),
  },
];

export const expandedLogColumns: ColumnDef<LogRow>[] = [
  ...logColumns,
  {
    id: "namespace",
    accessorFn: (row) => row.service.namespace,
    header: "Namespace",
    meta: { fixedWidth: 160 },
  },
  {
    id: "service",
    accessorFn: (row) => row.service.name,
    header: "Service",
    meta: { fixedWidth: 160 },
  },
];
