'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/ui';
import { Download, FileSpreadsheet, FileText, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { DensityToggle } from '@/components/portal/DensityToggle';
import { useLoadingCursor } from '@/hooks/useLoadingCursor';

interface Template {
    id: string;
    name: string;
    description: string;
    fileName: string;
    filePath: string;
    templateType: string;
}


export default function TemplatesPage() {
    const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
    const [density, setDensity] = useState<'comfortable' | 'dense'>('comfortable');

    const { data: templates, isLoading } = useQuery({
        queryKey: ['templates'],
        queryFn: async () => {
            const response = await api.get('/admin/templates');
            return response.data as Template[];
        },
    });

    useLoadingCursor(isLoading);

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


    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Upload Templates</h2>
                    <DensityToggle value={density} onChange={setDensity} />
                </div>
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Upload Templates</h2>
                    <p className="text-slate-500">Download templates for bulk data uploads</p>
                </div>
                <DensityToggle value={density} onChange={setDensity} />
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Template Preview</DialogTitle>
                        <DialogDescription>
                            Download the template to see column structure and expected format.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>Tip:</strong> Download the template file to view the exact column headers and expected data format.
                            Invalid rows will be flagged during the import process.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
