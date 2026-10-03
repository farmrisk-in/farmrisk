import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface MandiRow {
  s: string;
  d: string;
  m: string;
  c: string;
  v: string;
  t: string; // date
  a: number; // min
  b: number; // max
  p: number; // modal
}

export function useMandiData(stateName: string) {
  const [data, setData] = useState<MandiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stateName) {
      setData([]);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const d = new Date();
        d.setDate(d.getDate() - 15);
        const cutoff = d.toISOString().split("T")[0];

        const { data: result, error: dbError } = await supabase
          .from("mandi_prices")
          .select("*")
          .eq("state", stateName)
          .gte("arrival_date", cutoff)
          .limit(10000);

        if (dbError) throw dbError;

        if (isMounted && result) {
          setData(
            result.map((r: any) => ({
              s: r.state,
              d: r.district,
              m: r.market,
              c: r.commodity,
              v: r.variety,
              t: r.arrival_date,
              a: r.min_price,
              b: r.max_price,
              p: r.modal_price,
            }))
          );
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Unknown error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [stateName]);

  return { data, loading, error };
}
