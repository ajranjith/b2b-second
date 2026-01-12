'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Download, FileSpreadsheet, FileText, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Template {
    id: string;
    name: string;
    description: string;
    fileName: string;
    filePath: string;
    templateType: string;
}

const sampleData: Record<string, { headers: string[]; rows: string[][]; notes: string[] }> = {
    GENUINE_PARTS: {
        headers: ['PartNo', 'Description', 'Band1Price', 'Band2Price', 'Band3Price', 'Band4Price', 'FreeStock', 'AllocatedStock'],
        rows: [
            ['LPB000010', 'Oil Filter - 2.5L Diesel', '12.50', '11.25', '10.00', '8.75', '150', '25'],
            ['BP1001', 'Brake Pad Set - Front', '45.00', '40.50', '36.00', '31.50', '80', '12'],
            ['STC1234', 'Spark Plug Set', '28.00', '25.20', '22.40', '19.60', '200', '0'],
        ],
        notes: [
            'PartNo: Required - Unique part identifier',
            'Description: Required - Part description',
            'Band1-4Price: Required - Pricing for each band tier',
            'FreeStock: Required - Available inventory',
            'AllocatedStock: Optional - Reserved inventory',
        ],
    },
    AFTERMARKET_PARTS: {
        headers: ['PartNo', 'Description', 'Brand', 'Band1Price', 'Band2Price', 'Band3Price', 'Band4Price', 'FreeStock'],
        rows: [
            ['AM-123', 'Air Filter - Universal', 'Premium Auto', '8.50', '7.65', '6.80', '5.95', '300'],
            ['AM-456', 'Wiper Blade Set', 'ClearView', '15.00', '13.50', '12.00', '10.50', '120'],
        ],
        notes: [
            'PartNo: Required - Aftermarket part number',
            'Description: Required - Part description',
            'Brand: Required - Manufacturer brand',
            'Band1-4Price: Required - Aftermarket pricing tiers',
            'FreeStock: Required - Current stock level',
        ],
    },
    BACKORDERS: {
        headers: ['PartNo', 'DealerAccountNo', 'Quantity', 'ExpectedDate', 'Status'],
        rows: [
            ['LPB000010', 'DLR001', '50', '2024-02-15', 'CONFIRMED'],
            ['BP1001', 'DLR002', '25', '2024-02-20', 'PENDING'],
        ],
        notes: [
            'PartNo: Required - Part identifier from catalog',
            'DealerAccountNo: Required - Dealer account reference',
            'Quantity: Required - Number of units on backorder',
            'ExpectedDate: Required - Estimated delivery date (YYYY-MM-DD)',
            'Status: Required - CONFIRMED, PENDING, or CANCELLED',
        ],
    },
    FULFILLMENT: {
        headers: ['OrderNo', 'TrackingNumber', 'Carrier', 'ShippedDate', 'Status'],
        rows: [
            ['ORD-2024-001', 'TRK123456789', 'DPD', '2024-01-10', 'DISPATCHED'],
            ['ORD-2024-002', 'TRK987654321', 'Royal Mail', '2024-01-11', 'IN_TRANSIT'],
        ],
        notes: [
            'OrderNo: Required - Order reference number',
            'TrackingNumber: Required - Carrier tracking ID',
            'Carrier: Required - Shipping carrier name',
            'ShippedDate: Required - Dispatch date (YYYY-MM-DD)',
            'Status: Required - DISPATCHED, IN_TRANSIT, or DELIVERED',
        ],
    },
};

export default function TemplatesPage() {
    const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

    const { data: templates, isLoading } = useQuery({
        queryKey: ['templates'],
        queryFn: async () => {
            const response = await api.get('/admin/templates');
            return response.data as Template[];
        },
    });

    const handleDownload = async (template: Template) => {
        try {
            const response = await api.get(`/admin/templates/${template.id}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', template.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`Downloaded ${template.fileName}`);
        } catch (error: any) {
            toast.error('Failed to download template');
        }
    };

    const getTemplateIcon = (fileName: string) => {
        return fileName.endsWith('.xlsx') ? FileSpreadsheet : FileText;
    };

    const getPreviewData = (templateType: string) => {
        return sampleData[templateType] || sampleData.GENUINE_PARTS;
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold tracking-tight mb-6">Upload Templates</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-slate-200 rounded w-full" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-10 bg-slate-200 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Upload Templates</h2>
                <p className="text-slate-500">Download templates for bulk data uploads</p>
            </div>

            {/* Template Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => {
                    const Icon = getTemplateIcon(template.fileName);
                    return (
                        <Card
                            key={template.id}
                            className="shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200"
                        >
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        <CardDescription className="mt-1">{template.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm text-slate-500 font-mono bg-slate-50 px-3 py-2 rounded">
                                    {template.fileName}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleDownload(template)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setPreviewTemplate(template.templateType)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Template Format Preview</DialogTitle>
                        <DialogDescription>
                            Sample data showing the required format and column structure
                        </DialogDescription>
                    </DialogHeader>

                    {previewTemplate && (
                        <div className="space-y-6">
                            {/* Sample Data Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-blue-50">
                                            {getPreviewData(previewTemplate).headers.map((header) => (
                                                <TableHead key={header} className="font-semibold text-blue-900">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getPreviewData(previewTemplate).rows.map((row, idx) => (
                                            <TableRow key={idx}>
                                                {row.map((cell, cellIdx) => (
                                                    <TableCell key={cellIdx} className="font-mono text-sm">
                                                        {cell}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Column Descriptions */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-semibold mb-3">Column Descriptions</h4>
                                <ul className="space-y-2">
                                    {getPreviewData(previewTemplate).notes.map((note, idx) => (
                                        <li key={idx} className="text-sm text-slate-700 flex items-start">
                                            <span className="text-blue-600 mr-2">•</span>
                                            <span>{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Note:</strong> Ensure all required fields are filled and data formats match
                                    the examples shown above. Invalid rows will be flagged during the import process.
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
