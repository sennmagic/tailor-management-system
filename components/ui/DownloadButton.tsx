"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { API_BASE } from '@/lib/apiService';

interface DownloadButtonProps {
  id: string;
  buildUrl?: (id: string) => string; // defaults to invoices/download-bill/:id
  filename?: string; // optional explicit filename
  label?: string;
}

export function DownloadButton({ id, buildUrl, filename, label = 'Download Bill' }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    try {
      setDownloading(true);
      const path = buildUrl ? buildUrl(id) : `invoices/download-bill/${id}`;
      const url = `${API_BASE}/${path}`;

      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to download');
      }
      const blob = await res.blob();
      const href = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename || `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(href);
    } catch (e) {
      console.error('Download failed:', e);
      alert('Failed to download bill');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Downloading...' : label}
    </Button>
  );
}

export default DownloadButton;


