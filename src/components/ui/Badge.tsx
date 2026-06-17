import React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_LABELS } from '@/types';
import type { BookingStatus } from '@/types';

interface BadgeProps {
  status?: BookingStatus;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ status, variant = 'default', children, className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-sky-100 text-sky-700',
    gold: 'bg-gold-100 text-gold-700 border border-gold-300',
  };

  const statusClasses: Record<BookingStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-gray-100 text-gray-700',
    completed: 'bg-sky-100 text-sky-700',
  };

  const classes = status ? statusClasses[status] : variantClasses[variant];

  return (
    <span className={cn('badge', classes, className)}>
      {status ? STATUS_LABELS[status] : children}
    </span>
  );
}

export function StatusBadge({ status, showLabel = true }: { status: BookingStatus; showLabel?: boolean }) {
  return <Badge status={status}>{showLabel ? undefined : null}</Badge>;
}

export function MergedBadge() {
  return <Badge variant="gold">已合并</Badge>;
}

export function OvertimeBadge({ level }: { level: 1 | 2 | 3 }) {
  const labels = { 1: '预警', 2: '已升级', 3: '紧急' };
  const colors = {
    1: 'bg-amber-100 text-amber-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-rose-100 text-rose-700 animate-pulse-soft shadow-glow-rose',
  };
  return <Badge className={colors[level]}>{labels[level]}</Badge>;
}
