import axios, { AxiosInstance } from 'axios'

interface AggregatedRequest {
    key: string
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    url: string
    data?: any
    headers?: any
}

interface AggregatedResponse {
    [key: string]: {
        success: boolean
        data?: any
        error?: string
        status: number
    }
}

export class RequestAggregator {
    private apiClient: AxiosInstance

    constructor(baseURL: string) {
        this.apiClient = axios.create({
            baseURL,
            timeout: 10000,
        })
    }

    /**
     * Execute multiple API calls in parallel and consolidate results
     */
    async aggregate(
        requests: AggregatedRequest[],
        authToken?: string
    ): Promise<AggregatedResponse> {
        const results: AggregatedResponse = {}

        // Execute all requests in parallel
        const promises = requests.map(async (req) => {
            try {
                const headers = {
                    ...req.headers,
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                }

                const response = await this.apiClient({
                    method: req.method,
                    url: req.url,
                    data: req.data,
                    headers,
                })

                results[req.key] = {
                    success: true,
                    data: response.data,
                    status: response.status,
                }
            } catch (error: any) {
                results[req.key] = {
                    success: false,
                    error: error.response?.data?.error || error.message,
                    status: error.response?.status || 500,
                }
            }
        })

        await Promise.all(promises)
        return results
    }

    /**
     * Execute requests with dependencies (sequential)
     */
    async aggregateWithDependencies(
        requests: Array<AggregatedRequest & { dependsOn?: string }>,
        authToken?: string
    ): Promise<AggregatedResponse> {
        const results: AggregatedResponse = {}

        for (const req of requests) {
            // Check if dependency succeeded
            if (req.dependsOn && !results[req.dependsOn]?.success) {
                results[req.key] = {
                    success: false,
                    error: `Dependency ${req.dependsOn} failed`,
                    status: 424, // Failed Dependency
                }
                continue
            }

            try {
                const headers = {
                    ...req.headers,
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                }

                const response = await this.apiClient({
                    method: req.method,
                    url: req.url,
                    data: req.data,
                    headers,
                })

                results[req.key] = {
                    success: true,
                    data: response.data,
                    status: response.status,
                }
            } catch (error: any) {
                results[req.key] = {
                    success: false,
                    error: error.response?.data?.error || error.message,
                    status: error.response?.status || 500,
                }
            }
        }

        return results
    }
}
