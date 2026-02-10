import React from 'react';
import { Button } from '@/components/ui/button';
import { LinkIcon, Link2Icon } from 'lucide-react';

type TopBarProps = {
  connectMode: boolean;
  onToggleConnect: () => void;
};

const TopBar: React.FC<TopBarProps> = ({ connectMode, onToggleConnect }) => {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-card rounded-md px-4 py-2 shadow-lg border flex gap-2">
      <Button
        variant={connectMode ? 'default' : 'outline'}
        onClick={onToggleConnect}
        title={
          connectMode ? 'Exit connect mode' : 'Enter connect mode to draw connections between nodes'
        }
        className={`transition-all duration-200 ${
          connectMode
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
            : 'hover:bg-accent hover:border-primary text-foreground'
        }`}
      >
        {connectMode ? (
          <>
            <Link2Icon className="w-4 h-4 mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 mr-2" />
            Connect
          </>
        )}
      </Button>
    </div>
  );
};

export default TopBar;
