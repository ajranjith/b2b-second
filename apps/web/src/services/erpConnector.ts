export class ErpConnector {
    async pushToSuspended(orderData: any) {
        console.log('🚀 [ERP Connector] Pushing order to ERP "Suspended" state:', orderData.orderNo);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate successful ERP ingestion
        return {
            success: true,
            erpReference: `ERP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            ingestedAt: new Date()
        };
    }
}

export const erpConnector = new ErpConnector();
