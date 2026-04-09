import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { RiskLevel } from '@inspector-gnome/shared';

export interface ScanWithResult {
  id: string;
  userId: string;
  imagePath: string;
  location: string;
  notes: string | null;
  status: string;
  createdAt: string;
  riskLevel: RiskLevel | null;
  confidence: number | null;
}

export function useUserScans(limit?: number) {
  const { user } = useAuth();

  return useQuery<ScanWithResult[]>({
    queryKey: ['user-scans', user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      // 1. Fetch scans
      let scansQuery = supabase
        .from('scans')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (limit) {
        scansQuery = scansQuery.limit(limit);
      }

      const { data: scans, error: scansError } = await scansQuery;
      if (scansError) throw scansError;
      if (!scans || scans.length === 0) return [];

      // 2. Fetch analysis results separately — avoids RLS evaluation issues
      //    that occur with PostgREST nested resource selects.
      const scanIds = scans.map((s: Record<string, unknown>) => s.id as string);
      const { data: results } = await supabase
        .from('analysis_results')
        .select('scan_id, risk_level, confidence')
        .in('scan_id', scanIds);

      const resultsMap = new Map(
        (results ?? []).map((r: Record<string, unknown>) => [r.scan_id as string, r]),
      );

      // 3. Merge
      return scans.map((scan: Record<string, unknown>) => {
        const result = resultsMap.get(scan.id as string) ?? null;
        return {
          id: scan.id as string,
          userId: scan.user_id as string,
          imagePath: scan.image_path as string,
          location: scan.location as string,
          notes: (scan.notes as string | null) ?? null,
          status: scan.status as string,
          createdAt: scan.created_at as string,
          riskLevel: result ? (result.risk_level as RiskLevel) : null,
          confidence: result ? Number(result.confidence) : null,
        };
      });
    },
    staleTime: 15_000,
  });
}
