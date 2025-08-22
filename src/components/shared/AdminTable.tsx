// Reusable admin table component
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  MoreHorizontal,
  PlusCircle,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export interface AdminTableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface AdminTableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}

export interface AdminTableProps<T extends { id: string }> {
  data: T[];
  columns: AdminTableColumn<T>[];
  actions?: AdminTableAction<T>[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onCreate?: () => void;
  onBulkDelete?: (ids: string[]) => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  loading = false,
  error = null,
  title,
  description,
  onSearch,
  onFilter,
  onSort,
  onCreate,
  onBulkDelete,
  onExport,
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  className,
}: AdminTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Handle individual selection
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    onBulkDelete?.(selectedItems);
    setSelectedItems([]);
  };

  // Get cell value
  const getCellValue = (item: T, column: AdminTableColumn<T>) => {
    if (typeof column.key === "string" && column.key.includes(".")) {
      // Handle nested properties
      const keys = column.key.split(".");
      let value = item as any;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    }
    return item[column.key as keyof T];
  };

  // Render action with confirmation if needed
  const renderAction = (action: AdminTableAction<T>, item: T) => {
    const ActionComponent = (
      <DropdownMenuItem
        onClick={() => action.onClick(item)}
        className={action.variant === "destructive" ? "text-red-600" : ""}
      >
        {action.icon && <action.icon className="mr-2 h-4 w-4" />}
        {action.label}
      </DropdownMenuItem>
    );

    if (action.requiresConfirmation) {
      return (
        <AlertDialog key={action.label}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className={action.variant === "destructive" ? "text-red-600" : ""}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {action.confirmationTitle || "Are you sure?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {action.confirmationDescription ||
                  "This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => action.onClick(item)}
                className={
                  action.variant === "destructive"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return ActionComponent;
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-full sm:w-[200px]"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {selectedItems.length > 0 && onBulkDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedItems.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Items</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedItems.length}{" "}
                        items? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}

              {onCreate && (
                <Button size="sm" onClick={onCreate}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {/* Select all checkbox */}
              {onBulkDelete && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedItems.length === data.length && data.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}

              {/* Column headers */}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`${column.width || ""} ${
                    column.sortable ? "cursor-pointer hover:bg-muted/50" : ""
                  }`}
                  onClick={
                    column.sortable
                      ? () => handleSort(String(column.key))
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable &&
                      sortColumn === String(column.key) &&
                      (sortDirection === "asc" ? (
                        <SortAsc className="h-4 w-4" />
                      ) : (
                        <SortDesc className="h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              ))}

              {/* Actions column */}
              {actions.length > 0 && (
                <TableHead className="text-right w-[70px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {onBulkDelete && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <Skeleton className="h-4 w-8 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (onBulkDelete ? 1 : 0) +
                    (actions.length > 0 ? 1 : 0)
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((item) => (
                <TableRow key={item.id}>
                  {/* Selection checkbox */}
                  {onBulkDelete && (
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectItem(item.id, !!checked)
                        }
                      />
                    </TableCell>
                  )}

                  {/* Data cells */}
                  {columns.map((column) => {
                    const value = getCellValue(item, column);
                    return (
                      <TableCell key={String(column.key)}>
                        {column.render
                          ? column.render(value, item)
                          : String(value || "")}
                      </TableCell>
                    );
                  })}

                  {/* Actions dropdown */}
                  {actions.length > 0 && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {actions.map((action) => renderAction(action, item))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default AdminTable;
