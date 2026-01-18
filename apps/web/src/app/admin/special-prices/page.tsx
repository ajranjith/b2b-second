'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui';
import api from '@/lib/api';
import { DensityToggle } from '@/components/portal/DensityToggle';
import { useLoadingCursor } from '@/hooks/useLoadingCursor';

type ImportStatus = 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'SUCCEEDED_WITH_ERRORS';

interface ImportBatch {
  id: string;
  fileName: string;
  status: ImportStatus;
  startedAt: string;
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

export default function SpecialPricesPage() {
  const [density, setDensity] = useState<'comfortable' | 'dense'>('comfortable');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['imports', 'SPECIAL_PRICES'],
    queryFn: async () => {
      const response = await api.get('/admin/imports', {
        params: { type: 'SPECIAL_PRICES' },
      });
      return response.data.batches as ImportBatch[];
    },
    refetchInterval: 5000,
  });

  useLoadingCursor(isLoading);

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      if (!uploadFile) {
        alert('Please select a file to upload.');
        return;
      }
      if (!startDate || !endDate) {
        alert('Start Date and End Date are required.');
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        alert('Start Date must be before End Date.');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);

      await api.post('/admin/import/special-prices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadFile(null);
      setStartDate('');
      setEndDate('');
      await refetch();
      alert('Special price import started successfully.');
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Special Prices</h1>
          <p className="text-slate-500 mt-1">Upload special pricing with a required date window.</p>
        </div>
        <DensityToggle value={density} onChange={setDensity} />
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Special Prices File (Excel)</label>
              <Input type="file" accept=".xlsx,.xls" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Special Prices'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={density === 'dense' ? 'py-2' : 'py-4'}>File</TableHead>
                  <TableHead className={density === 'dense' ? 'py-2' : 'py-4'}>Status</TableHead>
                  <TableHead className={density === 'dense' ? 'py-2' : 'py-4'}>Started</TableHead>
                  <TableHead className={density === 'dense' ? 'py-2' : 'py-4'}>Totals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      Loading imports...
                    </TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className={density === 'dense' ? 'py-2' : 'py-4'}>
                        <div className="font-medium text-slate-900">{batch.fileName}</div>
                        <div className="text-xs text-slate-500">{batch.id}</div>
                      </TableCell>
                      <TableCell className={density === 'dense' ? 'py-2' : 'py-4'}>
                        <Badge variant="outline" className={statusColors[batch.status]}>
                          {batch.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className={density === 'dense' ? 'py-2' : 'py-4'}>
                        {new Date(batch.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className={density === 'dense' ? 'py-2' : 'py-4'}>
                        <div className="text-sm text-slate-600">
                          {batch.validRows ?? 0}/{batch.totalRows ?? 0} valid
                        </div>
                        {batch.invalidRows ? (
                          <div className="text-xs text-amber-600">{batch.invalidRows} errors</div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      No special price imports yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
