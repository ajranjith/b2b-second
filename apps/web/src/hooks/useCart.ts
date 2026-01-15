import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CartItem {
    id: string;
    productId: string;
    qty: number;
    product: {
        productCode: string;
        description: string;
        partType: string;
    };
    price: number;
}

interface Cart {
    items: CartItem[];
    subtotal: number;
    itemCount: number;
}

export function useCart() {
    const queryClient = useQueryClient();

    const { data: cart, isLoading, refetch } = useQuery<Cart>({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await api.get('/api/dealer/cart');
            return response.data;
        },
    });

    const addItemMutation = useMutation({
        mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
            const response = await api.post('/api/dealer/cart', { productId, qty });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Item added to cart');
        },
        onError: () => {
            toast.error('Failed to add item to cart');
        },
    });

    const updateItemMutation = useMutation({
        mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
            await api.patch(`/dealer/cart/items/${itemId}`, { qty });
        },
        onMutate: async ({ itemId, qty }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['cart'] });

            // Snapshot previous value
            const previousCart = queryClient.getQueryData<Cart>(['cart']);

            // Optimistically update
            queryClient.setQueryData<Cart>(['cart'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    items: old.items.map((item) =>
                        item.id === itemId ? { ...item, qty } : item
                    ),
                    subtotal: old.items.reduce((sum, item) =>
                        sum + (item.id === itemId ? item.price * qty : item.price * item.qty), 0
                    ),
                };
            });

            return { previousCart };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            toast.error('Failed to update quantity');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const removeItemMutation = useMutation({
        mutationFn: async (itemId: string) => {
            await api.delete(`/dealer/cart/items/${itemId}`);
        },
        onMutate: async (itemId) => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData<Cart>(['cart']);

            queryClient.setQueryData<Cart>(['cart'], (old) => {
                if (!old) return old;
                const newItems = old.items.filter((item) => item.id !== itemId);
                return {
                    ...old,
                    items: newItems,
                    itemCount: newItems.length,
                    subtotal: newItems.reduce((sum, item) => sum + item.price * item.qty, 0),
                };
            });

            return { previousCart };
        },
        onError: (err, variables, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            toast.error('Failed to remove item');
        },
        onSuccess: () => {
            toast.success('Item removed from cart');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    return {
        cart,
        items: cart?.items || [],
        itemCount: cart?.itemCount || 0,
        subtotal: cart?.subtotal || 0,
        addItem: addItemMutation.mutate,
        updateItem: updateItemMutation.mutate,
        removeItem: removeItemMutation.mutate,
        isLoading,
        isAddingItem: addItemMutation.isPending,
        refetch,
    };
}
