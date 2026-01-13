/**
 * Entitlement Rules
 * Access control based on dealer entitlements
 */

import { Entitlement, PartType } from '@prisma/client';
import { RuleResult } from '../types';
import { EntitlementError } from '../errors';

export interface ProductForEntitlement {
    id: string;
    productCode: string;
    partType: PartType | string;
}

export class EntitlementRules {
    /**
     * Check if dealer can view a product based on entitlement and part type
     */
    canViewProduct(dealerEntitlement: Entitlement | string, productPartType: PartType | string): boolean {
        // SHOW_ALL: can see everything
        if (dealerEntitlement === 'SHOW_ALL') {
            return true;
        }

        // GENUINE_ONLY: can only see GENUINE parts
        if (dealerEntitlement === 'GENUINE_ONLY') {
            return productPartType === 'GENUINE';
        }

        // AFTERMARKET_ONLY: can see AFTERMARKET and BRANDED, but not GENUINE
        if (dealerEntitlement === 'AFTERMARKET_ONLY') {
            return productPartType !== 'GENUINE';
        }

        return false;
    }

    /**
     * Check if dealer can view product and throw if not
     */
    assertCanViewProduct(dealerEntitlement: Entitlement | string, productPartType: PartType | string): void {
        if (!this.canViewProduct(dealerEntitlement, productPartType)) {
            throw new EntitlementError(
                'Product not available for your account type',
                dealerEntitlement as string,
                productPartType as string
            );
        }
    }

    /**
     * Filter products by dealer entitlement
     */
    filterProductsByEntitlement<T extends ProductForEntitlement>(
        products: T[],
        dealerEntitlement: Entitlement | string
    ): T[] {
        return products.filter(product =>
            this.canViewProduct(dealerEntitlement, product.partType)
        );
    }

    /**
     * Get visible part types for an entitlement
     */
    getVisiblePartTypes(dealerEntitlement: Entitlement | string): PartType[] {
        switch (dealerEntitlement) {
            case 'GENUINE_ONLY':
                return ['GENUINE'] as PartType[];
            case 'AFTERMARKET_ONLY':
                return ['AFTERMARKET', 'BRANDED'] as PartType[];
            case 'SHOW_ALL':
            default:
                return ['GENUINE', 'AFTERMARKET', 'BRANDED'] as PartType[];
        }
    }

    /**
     * Check entitlement with RuleResult wrapper
     */
    checkEntitlement(
        dealerEntitlement: Entitlement | string,
        productPartType: PartType | string
    ): RuleResult<boolean> {
        const canView = this.canViewProduct(dealerEntitlement, productPartType);

        if (canView) {
            return { success: true, data: true };
        }

        return {
            success: false,
            data: false,
            error: 'Product not available for your account type',
            errorCode: 'ENTITLEMENT_ERROR'
        };
    }

    /**
     * Get required band types for an entitlement
     * (Used when creating/updating band assignments)
     */
    getRequiredBandTypes(entitlement: Entitlement | string): PartType[] {
        // All dealers should have assignments for their visible part types
        return this.getVisiblePartTypes(entitlement);
    }
}
