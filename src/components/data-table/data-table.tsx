"use client";

import { Fragment, type KeyboardEvent, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import styles from "./style.module.css";

declare module "@tanstack/react-table" {
  // TanStack merges a default `size: 150` into every columnDef, so `size`
  // can't express "no explicit width"; meta.fixedWidth can.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    fixedWidth?: number;
  }
}

interface DataTableProps<TData> {
  rows: TData[];
  columns: ColumnDef<TData>[];
  getRowId: (row: TData) => string;
  emptyMessage: string;
  renderExpandedRow?: (row: TData) => ReactNode;
  pageSize?: number;
}

export function DataTable<TData>({
  rows,
  columns,
  getRowId,
  emptyMessage,
  renderExpandedRow,
  pageSize,
}: DataTableProps<TData>) {
  const expandable = renderExpandedRow !== undefined;
  const paginated = pageSize !== undefined;

  const table = useReactTable({
    data: rows,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => expandable,
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined,
    initialState: paginated ? { pagination: { pageSize } } : undefined,
  });

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    tableRow: Row<TData>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    tableRow.toggleExpanded();
  };

  if (rows.length === 0) {
    return <p className={styles.emptyNote}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className={styles.headerRow}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={styles.headerCell}
                  style={
                    header.column.columnDef.meta?.fixedWidth !== undefined
                      ? { width: header.column.columnDef.meta.fixedWidth }
                      : undefined
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
              {expandable && <th className={styles.expanderHeader} />}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((tableRow) => (
            <Fragment key={tableRow.id}>
              <tr
                className={
                  expandable
                    ? `${styles.dataRow} ${styles.expandableRow}`
                    : styles.dataRow
                }
                onClick={
                  expandable ? tableRow.getToggleExpandedHandler() : undefined
                }
                onKeyDown={
                  expandable
                    ? (event) => handleRowKeyDown(event, tableRow)
                    : undefined
                }
                tabIndex={expandable ? 0 : undefined}
                aria-expanded={expandable ? tableRow.getIsExpanded() : undefined}
              >
                {tableRow.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={styles.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {expandable && (
                  <td className={styles.expanderCell} aria-hidden="true">
                    <span
                      className={
                        tableRow.getIsExpanded()
                          ? `${styles.chevron} ${styles.chevronOpen}`
                          : styles.chevron
                      }
                    >
                      ▾
                    </span>
                  </td>
                )}
              </tr>
              {tableRow.getIsExpanded() && renderExpandedRow !== undefined && (
                <tr className={styles.expandedRow}>
                  <td colSpan={columns.length + 1}>
                    {renderExpandedRow(tableRow.original)}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      </div>
      {paginated && table.getPageCount() > 1 && (
        <nav className={styles.pager} aria-label="Table pagination">
          <button
            type="button"
            className={styles.pagerButton}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            ← <span className={styles.pagerButtonText}>prev</span>
          </button>
          <span className={styles.pagerStatus} aria-live="polite">
            page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            type="button"
            className={styles.pagerButton}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <span className={styles.pagerButtonText}>next</span> →
          </button>
        </nav>
      )}
    </div>
  );
}
