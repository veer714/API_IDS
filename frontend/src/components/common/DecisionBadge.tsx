import React from 'react';
import { SecurityDecision } from '../../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Ban } from 'lucide-react';

interface Props {
  decision: SecurityDecision | string;
}

export const DecisionBadge: React.FC<Props> = ({ decision }) => {
  const d = (decision || 'ALLOW').toUpperCase();

  switch (d) {
    case 'ALLOW':
      return (
        <span className="badge-allow">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ALLOW
        </span>
      );
    case 'CHALLENGE':
      return (
        <span className="badge-challenge">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          CHALLENGE
        </span>
      );
    case 'THROTTLE':
      return (
        <span className="badge-throttle">
          <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
          THROTTLE
        </span>
      );
    case 'BLOCK':
      return (
        <span className="badge-block">
          <Ban className="w-3.5 h-3.5 text-rose-400" />
          BLOCK
        </span>
      );
    default:
      return <span className="badge-allow">{d}</span>;
  }
};
