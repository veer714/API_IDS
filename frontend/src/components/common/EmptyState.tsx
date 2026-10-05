import React from 'react';
import { Shield } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-sentinel-800 rounded-xl bg-sentinel-900/40 my-4">
      <div className="w-12 h-12 rounded-full bg-sentinel-800/80 border border-sentinel-700/50 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Shield className="w-6 h-6 text-cyan-400" />}
      </div>
      <h3 className="text-base font-medium text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
