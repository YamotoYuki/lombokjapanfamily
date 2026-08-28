import type { ReactNode, TableHTMLAttributes } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface TableProps<T>
  extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  getRowKey: (row: T, index: number) => string | number;
}

export default function Table<T>({
  columns,
  data,
  emptyMessage = 'No data',
  getRowKey,
  className = '',
  ...props
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table
        className={['w-full min-w-[480px] border-collapse text-sm', className].join(
          ' ',
        )}
        {...props}
      >
        <thead>
          <tr className="border-b border-border bg-surface/80 text-left text-muted">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="border-b border-border/60 last:border-b-0 hover:bg-surface/40"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-white">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
