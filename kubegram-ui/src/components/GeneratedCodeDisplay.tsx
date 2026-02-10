import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Copy, 
  Download, 
  FileText, 
  Search, 
  Eye, 
  EyeOff,
  Maximize2,
  Clock,
  CheckCircle
} from 'lucide-react';

interface GeneratedCodeDisplayProps {
  codes: string[];
  nodeLabel: string;
  isLoading?: boolean;
  error?: string | null;
  onCopy?: (code: string) => void;
  onDownload?: (code: string, filename: string) => void;
  className?: string;
}

interface CodeVersion {
  code: string;
  index: number;
  language: string;
  timestamp?: string;
}

const GeneratedCodeDisplay: React.FC<GeneratedCodeDisplayProps> = memo(({
  codes,
  nodeLabel,
  isLoading = false,
  error = null,
  onCopy,
  onDownload,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [expandedCode, setExpandedCode] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Process codes with language detection
  const processedCodes: CodeVersion[] = codes.map((code, index) => ({
    code,
    index,
    language: detectLanguage(code),
    timestamp: new Date().toISOString()
  }));

  // Filter codes based on search term
  const filteredCodes = searchTerm 
    ? processedCodes.filter(({ code }) => 
        code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : processedCodes;

  // Simple language detection
  function detectLanguage(code: string): string {
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('import react') || lowerCode.includes('jsx') || lowerCode.includes('export default')) {
      return 'React/JSX';
    }
    if (lowerCode.includes('from flask') || lowerCode.includes('def ') || lowerCode.includes('import ')) {
      return 'Python';
    }
    if (lowerCode.includes('package main') || lowerCode.includes('func ') || lowerCode.includes('go.mod')) {
      return 'Go';
    }
    if (lowerCode.includes('using system') || lowerCode.includes('namespace ') || lowerCode.includes('public class')) {
      return 'C#';
    }
    if (lowerCode.includes('import java') || lowerCode.includes('public class') || lowerCode.includes('package ')) {
      return 'Java';
    }
    if (lowerCode.includes('dockerfile') || lowerCode.includes('from ') || lowerCode.includes('run ')) {
      return 'Docker';
    }
    if (lowerCode.includes('kubectl') || lowerCode.includes('apiversion') || lowerCode.includes('kind: ')) {
      return 'Kubernetes';
    }
    if (lowerCode.includes('const') || lowerCode.includes('let ') || lowerCode.includes('var ')) {
      return 'JavaScript';
    }
    if (lowerCode.includes('typescript') || lowerCode.includes(': string') || lowerCode.includes('interface ')) {
      return 'TypeScript';
    }
    
    return 'Generic';
  }

  // Get syntax highlighting class based on language
  function getSyntaxClass(language: string): string {
    const classes: Record<string, string> = {
      'React/JSX': 'language-jsx',
      'Python': 'language-python',
      'Go': 'language-go',
      'C#': 'language-csharp',
      'Java': 'language-java',
      'Docker': 'language-docker',
      'Kubernetes': 'language-yaml',
      'JavaScript': 'language-javascript',
      'TypeScript': 'language-typescript',
      'Generic': 'language-plaintext'
    };
    
    return classes[language] || 'language-plaintext';
  }

  // Copy code to clipboard
  const handleCopy = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      onCopy?.(code);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Download code as file
  const handleDownload = (code: string, index: number) => {
    const codeVersion = processedCodes[index];
    const extension = getFileExtension(codeVersion.language);
    const filename = `${nodeLabel}_${index + 1}.${extension}`;
    
    onDownload?.(code, filename);
    
    // Default download implementation
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get file extension based on language
  function getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      'React/JSX': 'jsx',
      'Python': 'py',
      'Go': 'go',
      'C#': 'cs',
      'Java': 'java',
      'Docker': 'dockerfile',
      'Kubernetes': 'yaml',
      'JavaScript': 'js',
      'TypeScript': 'ts',
      'Generic': 'txt'
    };
    
    return extensions[language] || 'txt';
  }

  // Add line numbers to code
  const addLineNumbers = (code: string): string[] => {
    return code.split('\n').map((line, index) => 
      `${(index + 1).toString().padStart(3, ' ')}  ${line}`
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading generated code...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Error loading generated code</span>
          </div>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // No code state
  if (codes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-full mx-auto w-fit">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">No Generated Code</h3>
            <p className="text-sm text-muted-foreground">
              This node doesn't have any generated code yet
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          className="flex items-center space-x-2"
        >
          {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="text-xs">Lines</span>
        </Button>
      </div>

      {/* Code Versions */}
      <div className="space-y-4">
        {filteredCodes.map((codeVersion) => {
          const isExpanded = expandedCode === codeVersion.index;
          const isCopied = copiedIndex === codeVersion.index;
          
          return (
            <Card key={codeVersion.index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm font-medium">
                      {nodeLabel} - Version {codeVersion.index + 1}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {codeVersion.language}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(codeVersion.code, codeVersion.index)}
                      className="h-8 w-8 p-0"
                      title={isCopied ? "Copied!" : "Copy code"}
                    >
                      {isCopied ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(codeVersion.code, codeVersion.index)}
                      className="h-8 w-8 p-0"
                      title="Download code"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCode(isExpanded ? null : codeVersion.index)}
                      className="h-8 w-8 p-0"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <div className={`bg-gray-900 text-gray-100 rounded-lg overflow-x-auto ${
                    isExpanded ? 'max-h-96' : 'max-h-48'
                  }`}>
                    <pre className="text-sm font-mono">
                      <code className={getSyntaxClass(codeVersion.language)}>
                        {showLineNumbers 
                          ? addLineNumbers(codeVersion.code).join('\n')
                          : codeVersion.code
                        }
                      </code>
                    </pre>
                  </div>
                  
                  {/* Expand/Collapse Indicator */}
                  {codeVersion.code.split('\n').length > 10 && (
                    <div className="absolute bottom-2 right-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandedCode(isExpanded ? null : codeVersion.index)}
                        className="h-6 px-2 text-xs bg-black/50 text-white border-0"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Code Metadata */}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>{codeVersion.code.split('\n').length} lines</span>
                  </div>
                  {codeVersion.timestamp && (
                    <span>
                      {new Date(codeVersion.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-center text-xs text-muted-foreground">
          Found {filteredCodes.length} of {codes.length} code versions
        </div>
      )}
    </div>
  );
});

GeneratedCodeDisplay.displayName = 'GeneratedCodeDisplay';

export default GeneratedCodeDisplay;