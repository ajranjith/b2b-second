/**
 * Toast Notification Utilities
 *
 * Wrapper around Sonner for consistent toast notifications
 */

import { toast } from 'sonner';

export const showToast = {
  /**
   * Success toast
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Error toast
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  },

  /**
   * Warning toast
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Info toast
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Loading toast (returns ID for dismissal)
   */
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
    });
  },

  /**
   * Promise toast (handles async operations)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// === COMMON TOAST MESSAGES ===
export const commonToasts = {
  // Cart
  addedToCart: (itemName: string) =>
    showToast.success('Added to cart', `${itemName} has been added to your cart`),

  removedFromCart: (itemName: string) =>
    showToast.success('Removed from cart', `${itemName} has been removed`),

  cartCleared: () => showToast.success('Cart cleared', 'All items removed from cart'),

  // Orders
  orderPlaced: (orderNumber: string) =>
    showToast.success('Order placed', `Order ${orderNumber} submitted successfully`),

  orderCancelled: (orderNumber: string) =>
    showToast.info('Order cancelled', `Order ${orderNumber} has been cancelled`),

  // General
  savedSuccessfully: () => showToast.success('Saved', 'Changes saved successfully'),

  deleteSuccess: () => showToast.success('Deleted', 'Item deleted successfully'),

  // Errors
  networkError: () =>
    showToast.error(
      'Network Error',
      'Unable to connect. Please check your internet connection.'
    ),

  serverError: () =>
    showToast.error(
      'Server Error',
      'Something went wrong. Please try again later.'
    ),

  notFound: (itemType: string) =>
    showToast.error('Not Found', `${itemType} not found`),

  unauthorized: () =>
    showToast.error(
      'Unauthorized',
      'Please log in to continue'
    ),

  validationError: (message: string) =>
    showToast.error('Validation Error', message),

  // Warnings
  unsavedChanges: () =>
    showToast.warning(
      'Unsaved Changes',
      'You have unsaved changes that will be lost'
    ),

  lowStock: (itemName: string) =>
    showToast.warning('Low Stock', `${itemName} is running low on stock`),
};
