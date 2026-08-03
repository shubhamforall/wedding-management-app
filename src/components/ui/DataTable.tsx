import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  pageSize?: number;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({ columns, data, pageSize = 20, emptyState }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  if (data.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-4 py-3 text-left font-medium text-text-muted">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        className={cn('inline-flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer hover:text-text')}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: <ChevronUp className="h-3.5 w-3.5" />, desc: <ChevronDown className="h-3.5 w-3.5" /> }[
                          header.column.getIsSorted() as string
                        ] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border-subtle hover:bg-bg-subtle">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-text">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
          <span className="text-xs text-text-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
