import React, { useState } from 'react';
import KonvaPage from './KonvaPage';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, ListChecks } from 'lucide-react';
import type { CanvasGraph } from '@/types/canvas';
import type { PlanResult } from '@/store/api/plan';

interface PlanViewPageProps {
  isSidebarCollapsed?: boolean;
  isHeaderCollapsed?: boolean;
}

interface LocationState {
  planResult?: PlanResult;
  planMarkdown?: string;
}

type TabType = 'spec' | 'context';

const PlanViewPage: React.FC<PlanViewPageProps> = ({
  isSidebarCollapsed = false,
  isHeaderCollapsed = false,
}) => {
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [activeTab, setActiveTab] = useState<TabType>('spec');

  // Resolve plan data: from route state or mock data in preview mode
  const [planResult, setPlanResult] = useState<PlanResult | null>(locationState?.planResult ?? null);
  const [planMarkdown, setPlanMarkdown] = useState<string>(locationState?.planMarkdown ?? '');

  // Load mock data in preview mode if no route state
  React.useEffect(() => {
    if (!planResult && import.meta.env.VITE_PREVIEW_MODE === 'true') {
      import('@/preview/mockData').then(({ MOCK_PLAN_RESULT, MOCK_PLAN_MARKDOWN }) => {
        setPlanResult(MOCK_PLAN_RESULT);
        setPlanMarkdown(MOCK_PLAN_MARKDOWN);
      });
    }
  }, [planResult]);

  const planGraph: CanvasGraph | null = planResult?.graph ?? null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Canvas — always visible, fills remaining space */}
      <div className="flex-1 min-w-0 h-full relative">
        <div className="absolute top-2 left-2 z-10 flex gap-2 items-center">
          <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md border border-border shadow-sm">
            <span className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Planned Graph
            </span>
          </div>
        </div>
        <KonvaPage
          isSidebarCollapsed={isSidebarCollapsed}
          isHeaderCollapsed={isHeaderCollapsed}
          initialGraphData={planGraph}
          codePanelMode="none"
          showToolbar={false}
        />
      </div>

      {/* Plan Spec Panel — fixed width, never overlaps canvas */}
      <div className="w-[45%] flex-shrink-0 border-l border-border bg-background flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-lg">Plan Specification</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated infrastructure plan
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setActiveTab('spec')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'spec'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Spec
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'context'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Context
          </button>
        </div>

        {/* Tab Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'spec' && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {planMarkdown ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {planMarkdown}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No plan specification available.
                </p>
              )}
            </div>
          )}

          {activeTab === 'context' && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-4">
                Plan context and assumptions:
              </div>
              {planResult?.context && planResult.context.length > 0 ? (
                <div className="space-y-2">
                  {planResult.context.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <p className="text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No context available.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanViewPage;
