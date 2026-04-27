import { useInfiniteQuery } from '@tanstack/react-query';
import { getInvoices } from '../services/subscription';

export function useInvoices() {
  return useInfiniteQuery({
    queryKey: ['invoices'],
    queryFn: ({ pageParam }) => getInvoices({ pageParam: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 60_000,
    retry: 1,
  });
}
