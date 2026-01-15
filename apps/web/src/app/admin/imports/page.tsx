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
    Badge,
    Card,
    CardContent,
    Tabs,
    TabsList,
    TabsTrigger,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui';
import { Upload, Package, Clock, Truck, ChevronDown, ChevronUp, Download } from 'lucide-react';
import api from '@/lib/api';

type ImportStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'SUCCEEDED_WITH_ERRORS';
type ImportType = 'PRODUCTS_GENUINE' | 'PRODUCTS_AFTERMARKET' | 'BACKORDERS' | 'FULFILLMENT';

interface ImportBatch {
    id: string;
    fileName: string;
    importType: ImportType;
    status: ImportStatus;
    startedAt: string;
    uploadedBy: {
        email: string;
    };
    totalRows?: number;
    validRows?: number;
    invalidRows?: number;
}

const statusColors: Record<ImportStatus, string> = {
    PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
    SUCCEEDED: 'bg-green-100 text-green-700 border-green-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
    SUCCEEDED_WITH_ERRORS: 'bg-amber-100 text-amber-700 border-amber-200',
};

const typeIcons: Record<string, any> = {
    PRODUCTS: Package,
    BACKORDERS: Clock,
    FULFILLMENT: Truck,
};

export default function ImportsPage() {
    const [statusFilter, setStatusFilter] = useState<ImportStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<ImportType | 'ALL'>('ALL');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadType, setUploadType] = useState<ImportType>('PRODUCTS_GENUINE');
    const [isUploading, setIsUploading] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['imports', statusFilter, typeFilter],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (typeFilter !== 'ALL') params.type = typeFilter;

            const response = await api.get('/admin/imports', { params });
            return response.data.batches as ImportBatch[];
        },
        refetchInterval: 5000,
    });

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const mockFilePath = `C:/uploads/mock_${Date.now()}.xlsx`;
            await api.post('/admin/import', {
                type: uploadType.startsWith('PRODUCTS') ? uploadType.split('_')[1] : uploadType,
                filePath: mockFilePath
            });
            setIsUploadModalOpen(false);
            alert('Import started successfully!');
        } catch (e: any) {
            alert('Upload failed: ' + e.message);
        } finally {
            setIsUploading(false);
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const getSuccessRate = (batch: ImportBatch) => {
        if (!batch.totalRows || batch.totalRows === 0) return 0;
        return Math.round(((batch.validRows || 0) / batch.totalRows) * 100);
    };

    const getTypeLabel = (type: ImportType) => {
        if (type.startsWith('PRODUCTS')) return 'PRODUCTS';
        return type;
    };

    const columns: ColumnDef<ImportBatch>[] = [
        {
            id: 'expand',
            cell: ({ row }) => {
                const isExpanded = expandedRows.has(row.original.id);
                return row.original.invalidRows && row.original.invalidRows > 0 ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(row.original.id)}
                        className="h-6 w-6 p-0"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                ) : null;
            },
        },
        {
            accessorKey: 'fileName',
            header: 'File Name',
            cell: ({ row }) => (
                <div className="font-medium">{row.original.fileName}</div>
            ),
        },
        {
            accessorKey: 'importType',
            header: 'Type',
            cell: ({ row }) => {
                const typeLabel = getTypeLabel(row.original.importType);
                const Icon = typeIcons[typeLabel] || Package;
                return (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700">
                        <Icon className="h-3 w-3 mr-1" />
                        {typeLabel}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={`${statusColors[row.original.status]} ${row.original.status === 'PROCESSING' ? 'animate-pulse' : ''
                        }`}
                >
                    {row.original.status.replace(/_/g, ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'startedAt',
            header: 'Uploaded At',
            cell: ({ row }) => (
                <div className="text-sm text-slate-600">
                    {new Date(row.original.startedAt).toLocaleString()}
                </div>
            ),
        },
        {
            accessorKey: 'totalRows',
            header: 'Total Rows',
            cell: ({ row }) => (
                <div className="text-sm font-mono">{row.original.totalRows?.toLocaleString() || '-'}</div>
            ),
        },
        {
            accessorKey: 'validRows',
            header: 'Valid',
            cell: ({ row }) => (
                <div className="text-sm font-mono text-green-600">{row.original.validRows?.toLocaleString() || '-'}</div>
            ),
        },
        {
            accessorKey: 'invalidRows',
            header: 'Invalid',
            cell: ({ row }) => (
                <div className="text-sm font-mono text-red-600">{row.original.invalidRows?.toLocaleString() || '-'}</div>
            ),
        },
        {
            id: 'successRate',
            header: 'Success Rate',
            cell: ({ row }) => {
                const rate = getSuccessRate(row.original);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${rate >= 95 ? 'bg-green-500' : rate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium">{rate}%</span>
                    </div>
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Import Management</h2>
                    <p className="text-slate-500">Monitor and manage data import processes</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsUploadModalOpen(true)}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                </Button>
            </div>

            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-[400px] shadow-2xl">
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="text-xl font-bold">Import Data</h3>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Import Type</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={uploadType}
                                    onChange={(e) => setUploadType(e.target.value as any)}
                                >
                                    <option value="PRODUCTS_GENUINE">Genuine Products</option>
                                    <option value="PRODUCTS_AFTERMARKET">Aftermarket Products</option>
                                    <option value="BACKORDERS">Backorders</option>
                                </select>
                            </div>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">Click to select or drag and drop XLSX file</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Start Import'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="shadow-sm border-slate-200">
                <CardContent className="pt-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Status Filter</label>
                        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                            <TabsList>
                                <TabsTrigger value="ALL">All</TabsTrigger>
                                <TabsTrigger value="SUCCEEDED">Success</TabsTrigger>
                                <TabsTrigger value="FAILED">Failed</TabsTrigger>
                                <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Type Filter</label>
                        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                            <TabsList>
                                <TabsTrigger value="ALL">All</TabsTrigger>
                                <TabsTrigger value="PRODUCTS_GENUINE">Products</TabsTrigger>
                                <TabsTrigger value="BACKORDERS">Backorders</TabsTrigger>
                                <TabsTrigger value="FULFILLMENT">Fulfillment</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

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
                                            Loading imports...
                                        </TableCell>
                                    </TableRow>
                                ) : (table.getRowModel().rows.length === 0) ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No imports found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <>
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            {expandedRows.has(row.original.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={columns.length} className="bg-slate-50 p-6">
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-sm">Import Errors</h4>
                                                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                                                <p className="text-sm text-slate-500">
                                                                    Error details would be displayed here.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
