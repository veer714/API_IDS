import React from 'react';

interface Props {
  score: number; // 0.0 to 1.0
  showPercent?: boolean;
}

export const RiskScoreBar: React.FC<Props> = ({ score, showPercent = true }) => {
  const clamped = Math.max(0, Math.min(1, score || 0));
  const percent = Math.round(clamped * 100);

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';

  if (clamped >= 0.70) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-400';
  } else if (clamped >= 0.40) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  } else if (clamped >= 0.20) {
    barColor = 'bg-sky-500';
    textColor = 'text-sky-400';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-sentinel-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showPercent && (
        <span className={`text-xs font-mono font-medium ${textColor}`}>
          {clamped.toFixed(2)}
        </span>
      )}
    </div>
  );
};
