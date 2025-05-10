import React from 'react';
import RemixIcon from './RemixIcon';
import Button from './Button';

type ConfirmModalPropsType = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

const ConfirmModal: React.FC<ConfirmModalPropsType> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="min-h-42 flex w-full max-w-sm flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full justify-between">
          <h1 className="mt-2 text-xl font-semibold">{title}</h1>
          <button onClick={onClose}>
            <RemixIcon name="ri-close-fill" className="ri-2x" />
          </button>
        </div>
        <p className="mt-2 text-gray-600">{description}</p>

        <Button
          variant="success"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="mt-4 w-full"
        >
          <p className="font-xl font-bold">{confirmText}</p>
        </Button>
      </div>
    </div>
  );
};

export default ConfirmModal;
