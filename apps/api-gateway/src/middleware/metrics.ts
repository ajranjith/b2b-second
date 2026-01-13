import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify'

interface Metrics {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    requestsByEndpoint: Map<string, number>
}

const metrics: Metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    requestsByEndpoint: new Map(),
}

export async function metricsRequest(
    request: FastifyRequest,
    reply: FastifyReply
) {
    request.startTime = Date.now()
    metrics.totalRequests++

    // Use routeOptions.url or fallback to url
    const endpoint = `${request.method} ${(request as any).routeOptions?.url || request.url}`
    metrics.requestsByEndpoint.set(
        endpoint,
        (metrics.requestsByEndpoint.get(endpoint) || 0) + 1
    )
}

export const metricsResponse = async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    if (!request.startTime) return payload;

    const duration = Date.now() - request.startTime

    if (reply.statusCode >= 200 && reply.statusCode < 400) {
        metrics.successfulRequests++
    } else {
        metrics.failedRequests++
    }

    // Update average response time
    metrics.averageResponseTime =
        (metrics.averageResponseTime * (metrics.totalRequests - 1) + duration) /
        metrics.totalRequests

    // Log slow requests
    if (duration > 1000) {
        request.log.warn(`Slow request: ${request.method} ${request.url} took ${duration}ms`)
    }

    return payload
}

export function getMetrics() {
    return {
        ...metrics,
        requestsByEndpoint: Object.fromEntries(metrics.requestsByEndpoint)
    }
}
