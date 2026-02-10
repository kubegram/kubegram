import React from 'react';
import { Button } from '@/components/ui/button';
import { X, HelpCircle } from 'lucide-react';

/**
 * HelpModal Component Props
 */
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * HelpModal Component
 *
 * A modal that displays keyboard shortcuts and help information
 * for the Konva canvas application.
 */
const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-card border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Help & Keyboard Shortcuts</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">ESC</kbd>
                <span className="text-muted-foreground">Cancel current operation</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Delete</kbd>
                <span className="text-muted-foreground">Delete selected items</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Ctrl+A</kbd>
                <span className="text-muted-foreground">Select all elements</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Ctrl+D</kbd>
                <span className="text-muted-foreground">Deselect all elements</span>
              </div>
            </div>
          </div>

          {/* Toolbar Shortcuts */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Toolbar Shortcuts</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">A</kbd>
                <span className="text-muted-foreground">Toggle arrow mode</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">S</kbd>
                <span className="text-muted-foreground">Toggle square arrow mode</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">C</kbd>
                <span className="text-muted-foreground">Toggle curved arrow mode</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">T</kbd>
                <span className="text-muted-foreground">Toggle toolbar visibility</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">G</kbd>
                <span className="text-muted-foreground">Generate code from graph</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">H</kbd>
                <span className="text-muted-foreground">Open help modal</span>
              </div>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Navigation Shortcuts</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">←</kbd>
                <span className="text-muted-foreground">Pan left</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">→</kbd>
                <span className="text-muted-foreground">Pan right</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">↑</kbd>
                <span className="text-muted-foreground">Pan up</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">↓</kbd>
                <span className="text-muted-foreground">Pan down</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Home</kbd>
                <span className="text-muted-foreground">Reset view to center</span>
              </div>
            </div>
          </div>

          {/* Canvas Management */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Canvas Management</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Ctrl+Delete</kbd>
                <span className="text-muted-foreground">Clear all canvas content</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Ctrl+Backspace</kbd>
                <span className="text-muted-foreground">Clear all canvas content</span>
              </div>
            </div>
          </div>

          {/* Selection & Interaction */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Selection & Interaction</h3>
            <div className="space-y-2 text-muted-foreground">
              <div>• Click items to select them</div>
              <div>• Click and drag to create a selection rectangle</div>
              <div>• Drag any selected item to move the entire group</div>
              <div>• Drag individual unselected items to move them alone</div>
              <div>• Click canvas to deselect all items</div>
              <div>• Right-click items for context menu</div>
              <div>• Use resize handles to resize nodes</div>
            </div>
          </div>

          {/* Canvas Navigation */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Canvas Navigation</h3>
            <div className="space-y-2 text-muted-foreground">
              <div>• Mouse wheel to zoom in/out</div>
              <div>• Click and drag empty canvas to pan around</div>
              <div>• Canvas supports infinite scrolling</div>
              <div>• "Back to Content" button appears when far from content</div>
              <div>• Click the button to smoothly return to center</div>
            </div>
          </div>

          {/* Arrow Mode */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Arrow Mode</h3>
            <div className="space-y-2 text-muted-foreground">
              <div>• Click the arrow button in the toolbar to enter arrow mode</div>
              <div>• Click nodes to start/end arrows</div>
              <div>• Click canvas for free-form arrows</div>
              <div>• Dragging and resizing are disabled in arrow mode</div>
              <div>• Press ESC to exit arrow mode</div>
            </div>
          </div>

          {/* Node Creation */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Node Creation</h3>
            <div className="space-y-2 text-muted-foreground">
              <div>• Use the node toolbar (top-left) to create new nodes</div>
              <div>• Drag node types from the toolbar onto the canvas</div>
              <div>• Nodes are automatically draggable and resizable</div>
              <div>• Each node type has its own icon and functionality</div>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Authentication</h3>
            <div className="space-y-2 text-muted-foreground">
              <div>• Login with Google, GitHub, GitLab, or email</div>
              <div>• Continue as guest for quick access</div>
              <div>• Your session is saved locally</div>
              <div>• Click the user menu in the header to manage your account</div>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Tips & Tricks</h3>
            <div className="space-y-2 text-muted-foreground">
              <div>• Use Ctrl+A to select all elements for bulk operations</div>
              <div>• Drag a selection rectangle to select multiple elements</div>
              <div>• Drag any selected element to move the entire group</div>
              <div>• Right-click on empty canvas to close context menus</div>
              <div>• Arrow mode provides precise connection points</div>
              <div>• Delete buttons appear when elements are selected</div>
              <div>• The canvas automatically saves your work</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end p-6">
          <Button onClick={onClose} className="px-6">
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
