'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
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
import { DealerDialog } from '@/admin';

type DealerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type Entitlement = 'GENUINE_ONLY' | 'AFTERMARKET_ONLY' | 'SHOW_ALL';

interface Dealer {
    id: string;
    accountNo: string;
    erpAccountNo?: string;
    companyName: string;
    status: DealerStatus;
    entitlement: Entitlement;
    users: Array<{
        firstName: string;
        lastName: string;
        appUser: {
            email: string;
        };
    }>;
}

const statusColors: Record<DealerStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
    SUSPENDED: 'bg-amber-100 text-amber-700 border-amber-200',
};

const entitlementColors: Record<Entitlement, string> = {
    GENUINE_ONLY: 'bg-blue-100 text-blue-700 border-blue-200',
    AFTERMARKET_ONLY: 'bg-purple-100 text-purple-700 border-purple-200',
    SHOW_ALL: 'bg-green-100 text-green-700 border-green-200',
};

export default function DealersPage() {
    const [statusFilter, setStatusFilter] = useState<DealerStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dealers', statusFilter, searchQuery],
        queryFn: async () => {
            const params: any = { limit: 1000 };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/admin/dealers', { params });
            return response.data.dealers as Dealer[];
        },
    });

    const handleResetPassword = async (dealerId: string, email: string) => {
        try {
            const dealer = data?.find(d => d.id === dealerId);
            const user = dealer?.users[0];
            if (!user) {
                toast.error('No user found for this dealer');
                return;
            }

            await api.post(`/admin/dealers/${dealerId}/reset-password`);
            toast.success(`Password reset email sent to ${email}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleDelete = async (dealerId: string, companyName: string) => {
        if (!confirm(`Are you sure you want to deactivate ${companyName}?`)) return;

        try {
            await api.delete(`/admin/dealers/${dealerId}`);
            toast.success('Dealer deactivated successfully');
            refetch();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to deactivate dealer');
        }
    };

    const columns: ColumnDef<Dealer>[] = [
        {
            accessorKey: 'accountNo',
            header: 'Account No',
            cell: ({ row }) => (
                <div className="font-mono text-sm font-medium">{row.original.accountNo}</div>
            ),
        },
        {
            accessorKey: 'erpAccountNo',
            header: 'ERP Account No',
            cell: ({ row }) => (
                <div className="text-sm text-slate-500">{row.original.erpAccountNo || '-'}</div>
            ),
        },
        {
            accessorKey: 'companyName',
            header: 'Company Name',
            cell: ({ row }) => (
                <div className="font-medium">{row.original.companyName}</div>
            ),
        },
        {
            id: 'contactName',
            header: 'Contact Name',
            cell: ({ row }) => {
                const user = row.original.users[0];
                return user ? (
                    <div className="text-sm">{`${user.firstName} ${user.lastName}`}</div>
                ) : (
                    <div className="text-sm text-slate-400">-</div>
                );
            },
        },
        {
            id: 'email',
            header: 'Email',
            cell: ({ row }) => {
                const user = row.original.users[0];
                return user ? (
                    <div className="text-sm text-slate-600">{user.appUser.email}</div>
                ) : (
                    <div className="text-sm text-slate-400">-</div>
                );
            },
        },
        {
            accessorKey: 'entitlement',
            header: 'Entitlement',
            cell: ({ row }) => (
                <Badge variant="outline" className={entitlementColors[row.original.entitlement]}>
                    {row.original.entitlement.replace(/_/g, ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="outline" className={statusColors[row.original.status]}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const dealer = row.original;
                const email = dealer.users[0]?.appUser.email || '';

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                                setSelectedDealer(dealer);
                                setIsDialogOpen(true);
                            }}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(dealer.id, email)}>
                                Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDelete(dealer.id, dealer.companyName)}
                                className="text-red-600"
                            >
                                Delete
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
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dealer Management</h2>
                    <p className="text-slate-500">Manage dealer accounts and permissions</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                    setSelectedDealer(null);
                    setIsDialogOpen(true);
                }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dealer
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="pt-6 space-y-4">
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by account no, company name, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Status Tabs */}
                    <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <TabsList>
                            <TabsTrigger value="ALL">All</TabsTrigger>
                            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                            <TabsTrigger value="INACTIVE">Inactive</TabsTrigger>
                            <TabsTrigger value="SUSPENDED">Suspended</TabsTrigger>
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
                                            Loading dealers...
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No dealers found
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
                                of {data.length} dealers
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

            <DealerDialog
                open={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedDealer(null);
                }}
                onSuccess={() => {
                    refetch();
                }}
                dealer={selectedDealer}
            />
        </div>
    );
}
