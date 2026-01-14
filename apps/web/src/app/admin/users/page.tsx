'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender,
    SortingState,
} from '@tanstack/react-table';
import {
    Button,
    Input,
    Badge,
    Card,
    CardContent,
    Tabs,
    TabsList,
    TabsTrigger,
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
} from '@/ui';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

type UserRole = 'ADMIN' | 'DEALER';

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
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['users', roleFilter, searchQuery],
        queryFn: async () => {
            const params: any = { limit: 1000 };
            if (roleFilter !== 'ALL') params.role = roleFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/admin/users', { params });
            return response.data.users as User[];
        },
    });

    const handleResetPassword = async (userId: string, email: string) => {
        if (!confirm(`Reset password for ${email}?`)) return;

        try {
            await api.post(`/admin/users/${userId}/reset-password`);
            toast.success(`Password reset email sent to ${email}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleDeactivate = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to deactivate ${email}?`)) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deactivated successfully');
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to deactivate user');
        }
    };

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => (
                <div className="font-medium">{row.original.email}</div>
            ),
        },
        {
            id: 'name',
            header: 'Name',
            cell: ({ row }) => {
                const user = row.original;
                if (user.role === 'DEALER' && user.dealerUser) {
                    return (
                        <div className="text-sm">
                            {user.dealerUser.firstName} {user.dealerUser.lastName}
                        </div>
                    );
                }
                return <div className="text-sm text-slate-400">-</div>;
            },
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={
                        row.original.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                    }
                >
                    {row.original.role}
                </Badge>
            ),
        },
        {
            accessorKey: 'adminRole',
            header: 'Admin Role',
            cell: ({ row }) => {
                const user = row.original;
                if (user.role === 'ADMIN' && user.adminRole) {
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
            id: 'dealerAccount',
            header: 'Dealer Account',
            cell: ({ row }) => {
                const user = row.original;
                if (user.role === 'DEALER' && user.dealerUser?.dealerAccount) {
                    const account = user.dealerUser.dealerAccount;
                    return (
                        <div className="text-sm">
                            <div className="font-medium">{account.companyName}</div>
                            <div className="text-slate-500">{account.accountNo}</div>
                        </div>
                    );
                }
                return <div className="text-sm text-slate-400">-</div>;
            },
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={
                        row.original.isActive
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                    }
                >
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            accessorKey: 'lastLoginAt',
            header: 'Last Login',
            cell: ({ row }) => {
                const lastLogin = row.original.lastLoginAt;
                return lastLogin ? (
                    <div className="text-sm text-slate-600">
                        {new Date(lastLogin).toLocaleDateString()}
                    </div>
                ) : (
                    <div className="text-sm text-slate-400">Never</div>
                );
            },
        },
        {
            id: 'actions',
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
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-slate-500">Manage admin and dealer user accounts</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Admin User
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Dealer User
                    </Button>
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

                    {/* Role Tabs */}
                    <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                        <TabsList>
                            <TabsTrigger value="ALL">All Users</TabsTrigger>
                            <TabsTrigger value="ADMIN">Admin Users</TabsTrigger>
                            <TabsTrigger value="DEALER">Dealer Users</TabsTrigger>
                        </TabsList>
                    </Tabs>
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
                                            <TableHead key={header.id}>
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
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
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
                                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                                {Math.min(
                                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                    data.length
                                )}{' '}
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
        </div>
    );
}
