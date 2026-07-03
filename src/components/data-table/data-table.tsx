"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    fixedWidth?: number;
  }
}

export interface RowFocusRequest {
  rowId: string;
  requestId: number;
}

interface DataTableProps<TData> {
  rows: TData[];
  columns: ColumnDef<TData>[];
  getRowId: (row: TData) => string;
  emptyMessage: string;
  renderExpandedRow?: (row: TData) => ReactNode;
  pageSize?: number;
  onRowHoverChange?: (row: TData | null) => void;
  rowFocusRequest?: RowFocusRequest;
}

export function DataTable<TData>({
  rows,
  columns,
  getRowId,
  emptyMessage,
  renderExpandedRow,
  pageSize,
  onRowHoverChange,
  rowFocusRequest,
}: DataTableProps<TData>) {
  const expandable = renderExpandedRow !== undefined;
  const paginated = pageSize !== undefined;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [flashedRowId, setFlashedRowId] = useState<string | null>(null);

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

  useEffect(() => {
    if (rowFocusRequest === undefined) return;
    const { rowId } = rowFocusRequest;
    const rowIndex = table
      .getPrePaginationRowModel()
      .rows.findIndex((tableRow) => tableRow.id === rowId);
    if (rowIndex === -1) return;

    if (paginated) {
      table.setPageIndex(
        Math.floor(rowIndex / table.getState().pagination.pageSize),
      );
    }
    setFlashedRowId(rowId);
    const frame = requestAnimationFrame(() => {
      scrollAreaRef.current
        ?.querySelector(`[data-row-id="${CSS.escape(rowId)}"]`)
        ?.scrollIntoView({ block: "center" });
    });
    const timer = setTimeout(() => setFlashedRowId(null), 1500);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowFocusRequest?.requestId]);

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
      <div className={styles.tableScroll} ref={scrollAreaRef}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
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
                data-row-id={tableRow.id}
                className={[
                  styles.dataRow,
                  expandable ? styles.expandableRow : "",
                  tableRow.id === flashedRowId ? styles.flashedRow : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
                onMouseEnter={
                  onRowHoverChange
                    ? () => onRowHoverChange(tableRow.original)
                    : undefined
                }
                onMouseLeave={
                  onRowHoverChange ? () => onRowHoverChange(null) : undefined
                }
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
