import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CodeGenerationPanel } from './CodeGenerationPanel';
import { useAppSelector } from '../store/hooks';

interface CodeGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedCode?: string | null;
  isGenerating?: boolean;
  isConnected?: boolean;
  error?: string | null;
  onClearCode?: () => void;
}



export function CodeGenerationModal({
  isOpen,
  onClose,
  generatedCode: propGeneratedCode,
  isGenerating: propIsGenerating,
  isConnected,
  error: propError,
  onClearCode,
  onGenerate
}: CodeGenerationModalProps & { onGenerate: () => void }) {
  const { isAuthenticated } = useAppSelector((state) => state.oauth);

  // Check authentication and trigger modal if needed
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      // Close this modal and trigger login modal
      onClose();
      window.dispatchEvent(new CustomEvent('triggerLoginModal'));
    }
  }, [isOpen, isAuthenticated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: '#2e2e2eff' }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Generate Code from Graph</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <CodeGenerationPanel
              generatedCode={propGeneratedCode}
              isGenerating={propIsGenerating}
              isConnected={isConnected}
              error={propError}
              onClearCode={onClearCode}
              onGenerate={onGenerate}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}



