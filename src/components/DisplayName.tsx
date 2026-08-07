import React from 'react';

interface DisplayNameProps {
  name: string;
  isAgent?: boolean;
  className?: string;
}

export function DisplayName({ name, isAgent = false, className = '' }: DisplayNameProps) {
  return (
    <span className={className}>
      {isAgent && <span aria-label="AI agent" title="AI agent" className="mr-1 text-[0.9em]">🤖</span>}
      {name}
    </span>
  );
}
