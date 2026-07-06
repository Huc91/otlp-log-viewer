"use client";

import { useMemo } from "react";
import { DataTable, type RowFocusRequest } from "@/components/data-table/data-table";
import type { LogRow } from "@/features/dashboard-logs/api/view-model";
import { useStore } from "@/features/dashboard-logs/stores";
import { HOUR_IN_MS } from "@/lib/constants";
import { LogDetails } from "../log-details/log-details";
import { expandedLogColumns, logColumns } from "./log-columns";

interface LogTableProps {
  rows: LogRow[];
  pageSize?: number;
  showServiceColumns?: boolean;
  followHourFocus?: boolean;
}

export function LogTable({
  rows,
  pageSize,
  showServiceColumns = false,
  followHourFocus = false,
}: LogTableProps) {
  const setHighlightedHour = useStore(
    (state) => state.setHighlightedHour,
  );
  const hourFocusRequest = useStore((state) =>
    followHourFocus ? state.hourFocusRequest : null,
  );

  const rowFocusRequest = useMemo<RowFocusRequest | undefined>(() => {
    if (hourFocusRequest === null) return undefined;
    const targetRow = rows.find(
      (row) =>
        row.timestampMs >= hourFocusRequest.hourMs &&
        row.timestampMs < hourFocusRequest.hourMs + HOUR_IN_MS,
    );
    if (targetRow === undefined) return undefined;
    return { rowId: targetRow.id, requestId: hourFocusRequest.requestId };
  }, [hourFocusRequest, rows]);

  return (
    <DataTable
      rows={rows}
      columns={showServiceColumns ? expandedLogColumns : logColumns}
      getRowId={(row) => row.id}
      emptyMessage="No logs in the selected window."
      renderExpandedRow={(row) => <LogDetails row={row} />}
      pageSize={pageSize}
      onRowHoverChange={(row) => setHighlightedHour(row ? row.timestampMs : null)}
      rowFocusRequest={rowFocusRequest}
    />
  );
}
