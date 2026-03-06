"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { DensityToggle } from "@/components/portal/DensityToggle";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

type UserRole = "ADMIN";

interface User {
  id: string;
  email: string;
  role: UserRole;
  adminRole?: string;
  isActive: boolean;
  lastLoginAt?: string;
  dealerUser?: {
    firstName: string;
    lastName: string;
    dealerAccount?: {
      companyName: string;
      accountNo: string;
    };
  };
}

export default function UsersPage() {
  const [roleFilter] = useState<UserRole>("ADMIN");
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [density, setDensity] = useState<"comfortable" | "dense">("comfortable");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"SUPER_ADMIN" | "ADMIN" | "OPS">("ADMIN");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users", roleFilter, searchQuery],
    queryFn: async () => {
      const params: any = { limit: 1000 };
      params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get("/admin/admin-users", { params });
      return response.data.users as User[];
    },
  });

  useLoadingCursor(isLoading);

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Reset password for ${email}?`)) return;

    try {
      await api.post(`/admin/admin-users/${userId}/reset-password`);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    }
  };

  const handleDeactivate = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to deactivate ${email}?`)) return;

    try {
      await api.delete(`/admin/admin-users/${userId}`);
      toast.success("User deactivated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to deactivate user");
    }
  };

  const handleCreateAdminUser = async () => {
    try {
      if (!newEmail || !newPassword) {
        toast.error("Email and password are required.");
        return;
      }
      await api.post("/admin/admin-users", {
        email: newEmail,
        password: newPassword,
        adminRole: newRole,
      });
      toast.success("Admin user created successfully");
      setIsCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("ADMIN");
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create admin user");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="font-medium">{row.original.email}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.role === "ADMIN"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-purple-100 text-purple-700 border-purple-200"
          }
        >
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "adminRole",
      header: "Admin Role",
      cell: ({ row }) => {
        const user = row.original;
        if (user.role === "ADMIN" && user.adminRole) {
          return (
            <Badge variant="outline" className="bg-slate-100 text-slate-700">
              {user.adminRole}
            </Badge>
          );
        }
        return <div className="text-sm text-slate-400">-</div>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.isActive
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.original.lastLoginAt;
        return lastLogin ? (
          <div className="text-sm text-slate-600">{new Date(lastLogin).toLocaleDateString()}</div>
        ) : (
          <div className="text-sm text-slate-400">Never</div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.email)}>
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeactivate(user.id, user.email)}
                className="text-red-600"
              >
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Users</h2>
          <p className="text-slate-500">Manage admin identities and roles</p>
        </div>
        <div className="flex items-center gap-3">
          <DensityToggle value={density} onChange={setDensity} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Admin User
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Showing Admin Users Only
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={density === "dense" ? "py-2" : "py-4"}>
                        {!header.isPlaceholder &&
                          flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="text-slate-400 mb-2">
                          <svg className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-700">
                          {searchQuery ? "No users match your search" : "No admin users yet"}
                        </span>
                        <span className="text-sm text-slate-500">
                          {searchQuery
                            ? "Try adjusting your search query."
                            : "Click \"Create Admin User\" to add your first admin."}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={density === "dense" ? "py-2" : "py-4"}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && data && data.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing{" "}
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{" "}
                to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  data.length,
                )}{" "}
                of {data.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>Add a new admin identity and role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Admin Role</Label>
              <select
                id="admin-role"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="OPS">Ops</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateAdminUser}>
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
