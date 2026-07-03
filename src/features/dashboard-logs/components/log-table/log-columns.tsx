import type { ColumnDef } from "@tanstack/react-table";
import { formatTime } from "@/lib/format";
import type { LogRow } from "@/features/dashboard-logs/api/view-model";
import { SeverityBadge } from "../severity-badge/severity-badge";
import styles from "./log-columns.module.css";

export const logColumns: ColumnDef<LogRow>[] = [
  {
    accessorKey: "severityBand",
    header: "Severity",
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
    cell: ({ row }) => formatTime(new Date(row.original.timestampMs)),
  },
  {
    accessorKey: "body",
    header: "Body",
    cell: ({ row }) => (
      <span className={styles.truncatedBody}>{row.original.body}</span>
    ),
  },
];
