"use client";

import { useState, useCallback, memo, useRef } from "react";
import { Plus, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableBlockProps {
  data: string[][];
  onDataChange: (data: string[][]) => void;
  onRemove: () => void;
  className?: string;
}

function TableBlockInner({
  data,
  onDataChange,
  onRemove,
  className,
}: TableBlockProps) {
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [showControls, setShowControls] = useState(false);
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

  // Ensure minimum table size
  const tableData =
    data.length > 0
      ? data
      : [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ];
  const rows = tableData.length;
  const cols = tableData[0]?.length || 3;

  // Update cell content
  const updateCell = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      const newData = tableData.map((row, ri) =>
        row.map((cell, ci) =>
          ri === rowIndex && ci === colIndex ? value : cell
        )
      );
      onDataChange(newData);
    },
    [tableData, onDataChange]
  );

  // Add row
  const addRow = useCallback(
    (afterIndex: number) => {
      const newRow = new Array(cols).fill("");
      const newData = [...tableData];
      newData.splice(afterIndex + 1, 0, newRow);
      onDataChange(newData);
    },
    [tableData, cols, onDataChange]
  );

  // Remove row
  const removeRow = useCallback(
    (index: number) => {
      if (rows <= 1) return;
      const newData = tableData.filter((_, i) => i !== index);
      onDataChange(newData);
    },
    [tableData, rows, onDataChange]
  );

  // Add column
  const addColumn = useCallback(
    (afterIndex: number) => {
      const newData = tableData.map((row) => {
        const newRow = [...row];
        newRow.splice(afterIndex + 1, 0, "");
        return newRow;
      });
      onDataChange(newData);
    },
    [tableData, onDataChange]
  );

  // Remove column
  const removeColumn = useCallback(
    (index: number) => {
      if (cols <= 1) return;
      const newData = tableData.map((row) => row.filter((_, i) => i !== index));
      onDataChange(newData);
    },
    [tableData, cols, onDataChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
      const key = e.key;
      let nextRow = rowIndex;
      let nextCol = colIndex;

      if (key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          // Move backwards
          nextCol--;
          if (nextCol < 0) {
            nextCol = cols - 1;
            nextRow--;
          }
        } else {
          // Move forwards
          nextCol++;
          if (nextCol >= cols) {
            nextCol = 0;
            nextRow++;
          }
        }
      } else if (key === "ArrowUp") {
        nextRow--;
      } else if (key === "ArrowDown") {
        nextRow++;
      } else if (key === "ArrowLeft" && e.metaKey) {
        nextCol--;
      } else if (key === "ArrowRight" && e.metaKey) {
        nextCol++;
      } else if (key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        nextRow++;
      }

      // Bounds checking
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
        const cellKey = `${nextRow}-${nextCol}`;
        const cell = cellRefs.current.get(cellKey);
        cell?.focus();
        setSelectedCell({ row: nextRow, col: nextCol });
      }
    },
    [rows, cols]
  );

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-3 -right-3 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remove table"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {tableData[0]?.map((cell, colIndex) => (
                <th
                  key={colIndex}
                  ref={(el) => {
                    if (el) cellRefs.current.set(`0-${colIndex}`, el);
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  className={cn(
                    "px-4 py-2 text-left text-sm font-semibold bg-secondary/50 border-b border-border outline-none",
                    "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                    selectedCell?.row === 0 &&
                      selectedCell?.col === colIndex &&
                      "bg-primary/10"
                  )}
                  onInput={(e) =>
                    updateCell(
                      0,
                      colIndex,
                      (e.target as HTMLTableCellElement).textContent || ""
                    )
                  }
                  onFocus={() => setSelectedCell({ row: 0, col: colIndex })}
                  onKeyDown={(e) => handleKeyDown(e, 0, colIndex)}
                  dangerouslySetInnerHTML={{ __html: cell }}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex + 1}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    ref={(el) => {
                      if (el)
                        cellRefs.current.set(`${rowIndex + 1}-${colIndex}`, el);
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    className={cn(
                      "px-4 py-2 text-sm border-b border-border outline-none",
                      "focus:ring-2 focus:ring-inset focus:ring-primary/50",
                      selectedCell?.row === rowIndex + 1 &&
                        selectedCell?.col === colIndex &&
                        "bg-primary/5"
                    )}
                    onInput={(e) =>
                      updateCell(
                        rowIndex + 1,
                        colIndex,
                        (e.target as HTMLTableCellElement).textContent || ""
                      )
                    }
                    onFocus={() =>
                      setSelectedCell({ row: rowIndex + 1, col: colIndex })
                    }
                    onKeyDown={(e) => handleKeyDown(e, rowIndex + 1, colIndex)}
                    dangerouslySetInnerHTML={{ __html: cell }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row/Column controls */}
      {showControls && (
        <>
          {/* Add row button */}
          <button
            onClick={() => addRow(rows - 1)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-1 rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-110 transition-transform"
            title="Add row"
          >
            <Plus className="h-3 w-3" />
          </button>

          {/* Add column button */}
          <button
            onClick={() => addColumn(cols - 1)}
            className="absolute top-1/2 -right-3 -translate-y-1/2 p-1 rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-110 transition-transform"
            title="Add column"
          >
            <Plus className="h-3 w-3" />
          </button>

          {/* Row remove buttons */}
          {rows > 1 &&
            tableData.map((_, rowIndex) => (
              <button
                key={`row-${rowIndex}`}
                onClick={() => removeRow(rowIndex)}
                className="absolute -left-3 p-1 rounded-full bg-destructive/80 text-destructive-foreground shadow-sm hover:bg-destructive transition-colors"
                style={{
                  top: `${(rowIndex + 0.5) * (100 / rows)}%`,
                  transform: "translateY(-50%)",
                }}
                title="Remove row"
              >
                <Minus className="h-2 w-2" />
              </button>
            ))}
        </>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        Tab to navigate • Enter for new row • Click + to add rows/columns
      </p>
    </div>
  );
}

export const TableBlock = memo(TableBlockInner);
