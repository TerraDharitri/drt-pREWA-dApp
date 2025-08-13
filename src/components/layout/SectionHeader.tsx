// src/components/layout/SectionHeader.tsx
"use client";

import React from 'react';

export function SectionHeader({
  title,
  subtitle,
  cta,
}: {
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </header>
  );
}