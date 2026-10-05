import React from 'react';
import { SeverityLevel } from '../../types';

interface Props {
  severity: SeverityLevel | string;
}

export const SeverityBadge: React.FC<Props> = ({ severity }) => {
  const s = (severity || 'INFO').toUpperCase();

  switch (s) {
    case 'CRITICAL':
      return <span className="severity-critical">CRITICAL</span>;
    case 'HIGH':
      return <span className="severity-high">HIGH</span>;
    case 'MEDIUM':
      return <span className="severity-medium">MEDIUM</span>;
    case 'LOW':
      return <span className="severity-low">LOW</span>;
    case 'INFO':
    default:
      return <span className="severity-info">INFO</span>;
  }
};
