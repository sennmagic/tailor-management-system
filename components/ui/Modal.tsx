"use client";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isFullScreen?: boolean;
}

export function Modal({ open, onClose, children, isFullScreen = false }: ModalProps) {
  if (!open) return null;
  
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        {children}
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-800 text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
