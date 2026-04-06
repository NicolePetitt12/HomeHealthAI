import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface MoldStatusCounts {
  likelyMold: number;   // risk_level = 'high'
  notSure: number;      // risk_level = 'moderate'
  unlikelyMold: number; // risk_level = 'low'
}

export function useMoldStatusCounts() {
  return useQuery<MoldStatusCounts>({
    queryKey: ['mold-status-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('risk_level');

      if (error) throw error;

      const counts: MoldStatusCounts = { likelyMold: 0, notSure: 0, unlikelyMold: 0 };
      for (const row of data ?? []) {
        if (row.risk_level === 'high') counts.likelyMold++;
        else if (row.risk_level === 'moderate') counts.notSure++;
        else if (row.risk_level === 'low') counts.unlikelyMold++;
      }
      return counts;
    },
    staleTime: 30_000,
  });
}
