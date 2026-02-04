'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/ui';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

/**
 * Client Component for refreshing server-rendered data
 * 
 * Uses Next.js router.refresh() to trigger a server-side re-fetch
 * without a full page reload. This maintains the server-side rendering
 * benefits while providing interactive refresh functionality.
 */
export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        router.refresh();
        // Reset after a short delay to show visual feedback
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
        >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
    );
}
