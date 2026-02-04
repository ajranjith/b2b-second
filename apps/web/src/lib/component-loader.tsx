// Dynamic Component Loader
// Load components at runtime based on configuration

import React, { ComponentType, Suspense } from 'react'
import { getComponent } from '@/components/registry'

interface LoaderConfig {
    [route: string]: {
        components: string[]  // Component aliases to load
        layout?: string       // Layout component
    }
}

// Route-based component configuration
const routeConfig: LoaderConfig = {
    '/dealer/search': {
        components: ['dealer.product-card', 'dealer.mini-cart'],
        layout: 'dealer.layout',
    },
    '/dealer/cart': {
        components: ['dealer.cart-summary', 'dealer.order-list'],
        layout: 'dealer.layout',
    },
    '/admin/dealers': {
        components: ['admin.dealer-table', 'admin.dealer-form'],
        layout: 'admin.layout',
    },
}

/**
 * Load components for a specific route
 */
export function loadRouteComponents(route: string): ComponentType<any>[] {
    const config = routeConfig[route]
    if (!config) return []

    return config.components
        .map(alias => getComponent(alias))
        .filter(Boolean) as ComponentType<any>[]
}

/**
 * Dynamic component wrapper with Suspense
 */
export function DynamicComponent({
    alias,
    fallback = React.createElement('div', null, 'Loading...'),
    ...props
}: {
    alias: string
    fallback?: React.ReactNode
    [key: string]: any
}): React.ReactElement | null {
    const Component = getComponent(alias)

    if (!Component) {
        console.warn(`Component alias "${alias}" not found`)
        return null
    }

    return (
        <Suspense fallback={fallback}>
            <Component {...props} />
        </Suspense>
    )
}
