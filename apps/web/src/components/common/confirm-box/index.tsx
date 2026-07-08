'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import clsx from 'clsx';

interface ConfirmBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  heading?: string;
  noButtonText?: string;
  yesButtonText?: string;
  bodyText?: string;
  loading?: boolean;
  variant?: 'danger' | 'success' | 'informative'; // Updated variants
}

export default function ConfirmBox({
  isOpen,
  onClose,
  onSubmit,
  heading = 'Confirm Action',
  noButtonText = 'Cancel',
  yesButtonText = 'Yes',
  bodyText = 'Are you sure you want to proceed with this action?',
  loading,
  variant = 'danger', // default
}: ConfirmBoxProps) {
  const variantStyles = {
    danger: {
      icon: <FaExclamationTriangle className="text-3xl text-destructive" />,
      color: ' ',
      buttonVariant: 'destructive',
    },
    success: {
      icon: <FaCheck className="text-3xl text-primary" />,
      color: ' ',
      buttonVariant: 'default',
    },
    informative: {
      icon: <FaInfoCircle className="text-3xl text-blue-600" />,
      color: ' ',
      buttonVariant: 'default',
    },
  };

  const { icon, color, buttonVariant } = variantStyles[variant];

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:text-center gap-3">
        <AlertDialogHeader className="flex flex-col justify-center items-center">
          <div className={clsx('w-10 h-10 flex justify-center items-center', color)}>
            {icon}
          </div>
          <AlertDialogTitle className="text-foreground">{heading}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <span>{bodyText}</span>
        </AlertDialogDescription>
        <AlertDialogFooter className="sm:justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onClose}
          >
            {noButtonText}
          </Button>
          <Button
            type="button"
            variant={buttonVariant as 'default' | 'destructive'}
            className={variant !== 'danger' ? color : ''}
            loading={loading}
            onClick={onSubmit}
          >
            {yesButtonText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
