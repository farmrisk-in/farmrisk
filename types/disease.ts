export interface PredictionItem {
  label: string;
  confidence: number;
  confidence_pct: string;
  crop?: string;
  is_healthy: boolean;
  has_kb_entry?: boolean;
  kb_key?: string;
}

export interface DiseasePrediction {
  top_prediction: string;
  confidence: number;
  confidence_pct: string;
  is_healthy: boolean;
  is_low_confidence?: boolean;
  threshold?: number;
  note?: string;
  top_k?: PredictionItem[];
}

export interface DiseaseAdvisory {
  disease: string;
  is_healthy?: boolean;
  kb_key?: string;
  markdown?: string;
  sections?: Record<string, string>;
  context_markdown?: string;
  search_html?: string;
}

export interface DiseaseAnalysisResult {
  prediction: DiseasePrediction;
  advisory?: DiseaseAdvisory | null;
}
