import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { AnalysisResult, Finding } from '@inspector-gnome/shared';

// Maps snake_case DB columns → camelCase AnalysisResult type
function mapRow(row: Record<string, unknown>): AnalysisResult {
  return {
    id: row.id as string,
    scanId: row.scan_id as string,
    riskLevel: row.risk_level as AnalysisResult['riskLevel'],
    confidence: Number(row.confidence),
    findings: (row.findings as Finding[]) ?? [],
    explanation: (row.explanation as string | null) ?? null,
    nextSteps: (row.next_steps as string[]) ?? [],
    modelVersion: (row.model_version as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function useAnalysisResult(scanId: string | undefined) {
  return useQuery({
    queryKey: ['analysis', scanId],
    enabled: !!scanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('scan_id', scanId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // no row yet — still processing
        throw error;
      }

      return mapRow(data as Record<string, unknown>);
    },
    // Poll every 3s while no result exists; stop once data arrives
    refetchInterval: (query) => (query.state.data ? false : 3000),
    staleTime: 0,
  });
}
