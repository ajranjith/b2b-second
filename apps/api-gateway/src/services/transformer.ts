export class TransformerService {
    // Service to transform responses before sending to client
    // e.g. masking PII, restructuring JSON, etc.

    static transformProductData(backendData: any) {
        // Example transformation
        return {
            id: backendData.id,
            name: backendData.name,
            // Map other fields...
        };
    }
}
