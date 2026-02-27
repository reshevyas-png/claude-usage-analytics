// Prism design system — department/team color map
// Used across Dashboard, API Keys, and Requests pages for consistent color coding

export const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; dot: string; fill: string; border: string }> = {
  legal:       { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA', dot: '#8B5CF6', fill: '#8B5CF6', border: 'rgba(139,92,246,0.3)' },
  sales:       { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24', dot: '#F59E0B', fill: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  engineering: { bg: 'rgba(56,189,248,0.12)',  text: '#7DD3FC', dot: '#38BDF8', fill: '#38BDF8', border: 'rgba(56,189,248,0.3)' },
  hr:          { bg: 'rgba(16,185,129,0.12)',  text: '#6EE7B7', dot: '#10B981', fill: '#10B981', border: 'rgba(16,185,129,0.3)' },
  marketing:   { bg: 'rgba(244,63,94,0.12)',   text: '#FDA4AF', dot: '#F43F5E', fill: '#F43F5E', border: 'rgba(244,63,94,0.3)' },
  finance:     { bg: 'rgba(168,85,247,0.12)',   text: '#C4B5FD', dot: '#A855F7', fill: '#A855F7', border: 'rgba(168,85,247,0.3)' },
  product:     { bg: 'rgba(251,146,60,0.12)',   text: '#FDBA74', dot: '#FB923C', fill: '#FB923C', border: 'rgba(251,146,60,0.3)' },
};

// Ordered color palette for chart segments when department is unknown
export const CHART_COLORS = ['#8B5CF6', '#F59E0B', '#38BDF8', '#10B981', '#F43F5E', '#A855F7', '#FB923C', '#E879F9'];

// Get color for a label — tries to match department keywords, falls back to index-based
export function getColorForLabel(label: string | null, index: number): { bg: string; text: string; dot: string; fill: string; border: string } {
  if (label) {
    const lower = label.toLowerCase();
    for (const [dept, colors] of Object.entries(DEPARTMENT_COLORS)) {
      if (lower.includes(dept)) return colors;
    }
  }
  // Fallback: cycle through chart colors
  const fill = CHART_COLORS[index % CHART_COLORS.length];
  return {
    bg: `${fill}1F`,
    text: fill,
    dot: fill,
    fill,
    border: `${fill}4D`,
  };
}
