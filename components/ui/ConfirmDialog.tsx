"use client";

import React from 'react';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  description,
  primaryLabel = 'Confirm',
  secondaryLabel = 'Cancel',
  onPrimary,
  onSecondary,
  onClose,
  danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
        </div>
        {(message || description) && (
          <div className="px-6 py-4 text-gray-700">
            {message}
          </div>
        )}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onSecondary || onClose}>{secondaryLabel}</Button>
          <Button onClick={onPrimary} className={danger ? 'bg-red-600 hover:bg-red-700 text-white' : ''}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}


