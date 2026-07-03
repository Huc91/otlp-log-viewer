"use client";

import { Fragment, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import styles from "./style.module.css";

interface DataTableProps<TData> {
  rows: TData[];
  columns: ColumnDef<TData>[];
  getRowId: (row: TData) => string;
  emptyMessage: string;
  renderExpandedRow?: (row: TData) => ReactNode;
}

export function DataTable<TData>({
  rows,
  columns,
  getRowId,
  emptyMessage,
  renderExpandedRow,
}: DataTableProps<TData>) {
  const expandable = renderExpandedRow !== undefined;

  const table = useReactTable({
    data: rows,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => expandable,
  });

  if (rows.length === 0) {
    return <p className={styles.emptyNote}>{emptyMessage}</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className={styles.headerRow}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} className={styles.headerCell}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </th>
            ))}
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
            >
              {tableRow.getVisibleCells().map((cell) => (
                <td key={cell.id} className={styles.cell}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
            {tableRow.getIsExpanded() && renderExpandedRow !== undefined && (
              <tr className={styles.expandedRow}>
                <td colSpan={columns.length}>
                  {renderExpandedRow(tableRow.original)}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
