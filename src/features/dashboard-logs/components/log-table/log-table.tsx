"use client";

import { DataTable } from "@/components/data-table/data-table";
import type { LogRow } from "@/features/dashboard-logs/api/view-model";
import { LogDetails } from "../log-details/log-details";
import { expandedLogColumns, logColumns } from "./log-columns";

interface LogTableProps {
  rows: LogRow[];
  pageSize?: number;
  showServiceColumns?: boolean;
}

export function LogTable({
  rows,
  pageSize = 12,
  showServiceColumns = false,
}: LogTableProps) {
  return (
    <DataTable
      rows={rows}
      columns={showServiceColumns ? expandedLogColumns : logColumns}
      getRowId={(row) => row.id}
      emptyMessage="No log rows yet — waiting on the data formatting algorithm (flattenLogs)."
      renderExpandedRow={(row) => <LogDetails row={row} />}
      pageSize={pageSize}
    />
  );
}
