"use client";

import React from 'react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxButtons?: number; // how many numbered buttons to show (windowed)
}

export default function Pagination({ currentPage, totalPages, onPageChange, maxButtons = 5 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const clampedCurrent = Math.min(Math.max(1, currentPage), totalPages);
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, clampedCurrent - half);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex items-center justify-between p-3">
      <div className="text-sm text-gray-600">Page {clampedCurrent} of {totalPages}</div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={clampedCurrent === 1} onClick={() => onPageChange(clampedCurrent - 1)}>Prev</Button>
        {pages.map((p) => (
          <Button key={p} variant={p === clampedCurrent ? undefined : 'outline'} onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}
        <Button variant="outline" disabled={clampedCurrent === totalPages} onClick={() => onPageChange(clampedCurrent + 1)}>Next</Button>
      </div>
    </div>
  );
}


