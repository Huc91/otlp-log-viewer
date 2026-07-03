"use client";

import { DataTable } from "@/components/data-table/data-table";
import type { LogRow } from "@/features/dashboard-logs/api/view-model";
import { LogDetails } from "../log-details/log-details";
import { logColumns } from "./log-columns";

interface LogTableProps {
  rows: LogRow[];
}

export function LogTable({ rows }: LogTableProps) {
  return (
    <DataTable
      rows={rows}
      columns={logColumns}
      getRowId={(row) => row.id}
      emptyMessage="No log rows yet — waiting on the data formatting algorithm (flattenLogs)."
      renderExpandedRow={(row) => <LogDetails row={row} />}
      pageSize={12}
    />
  );
}
