// Component Registry - Runtime lookup system
// Allows swapping implementations without changing imports

import { ComponentType } from 'react'

// Component Registry Type
interface ComponentRegistry {
    [key: string]: ComponentType<any>
}

// Lazy load components
const registry: ComponentRegistry = {}

/**
 * Register a component with an alias
 */
export function registerComponent(alias: string, component: ComponentType<any>) {
    registry[alias] = component
}

/**
 * Get component by alias
 */
export function getComponent(alias: string): ComponentType<any> | null {
    return registry[alias] || null
}

/**
 * Check if component exists
 */
export function hasComponent(alias: string): boolean {
    return alias in registry
}

/**
 * Register multiple components at once
 */
export function registerComponents(components: ComponentRegistry) {
    Object.assign(registry, components)
}

/**
 * Get all registered component aliases
 */
export function getRegisteredAliases(): string[] {
    return Object.keys(registry)
}

// Pre-register common components
import { lazy } from 'react'

// Lazy load dealer components
registerComponents({
    'dealer.product-card': lazy(() => import('./dealer/ProductCard')),
    'dealer.cart-summary': lazy(() => import('./dealer/CartSummary')),
    'dealer.mini-cart': lazy(() => import('./dealer/MiniCart')),
    'dealer.order-list': lazy(() => import('./dealer/OrderList')),

    // Admin components
    'admin.dealer-table': lazy(() => import('./admin/DealerTable')),
    'admin.dealer-form': lazy(() => import('./admin/DealerForm')),
    'admin.user-table': lazy(() => import('./admin/UserTable')),

    // UI components
    'ui.button': lazy(() => import('./ui/button').then(m => ({ default: m.Button }))),
    'ui.card': lazy(() => import('./ui/card').then(m => ({ default: m.Card }))),
    'ui.dialog': lazy(() => import('./ui/dialog').then(m => ({ default: m.Dialog }))),
})

export { registry }
