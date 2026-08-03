import { Construction } from 'lucide-react';
import { EmptyState } from './EmptyState';

export function ComingSoon({ moduleName }: { moduleName: string }) {
  return (
    <div className="p-4">
      <EmptyState
        icon={Construction}
        title={`${moduleName} is on the way`}
        description="This module is built in a later phase of the roadmap."
      />
    </div>
  );
}
