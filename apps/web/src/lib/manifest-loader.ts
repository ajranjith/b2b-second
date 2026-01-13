// Load components from manifest
import componentsManifest from '@/config/components.json'

export function getComponentPath(alias: string): string | null {
    // Parse alias (e.g., "dealer.product-card" -> ["dealer", "product-card"])
    const [module, component] = alias.split('.')

    const componentConfig = (componentsManifest.components as any)[module]?.[component]
    return componentConfig?.path || null
}

export function getRouteComponents(route: string): string[] {
    return (componentsManifest.routes as any)[route] || []
}

export function getComponentVersion(alias: string): string {
    const [module, component] = alias.split('.')
    return (componentsManifest.components as any)[module]?.[component]?.version || '0.0.0'
}
