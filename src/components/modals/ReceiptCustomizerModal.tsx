import React from 'react';
import { DraggableModalWrapper } from '../common/DraggableModalWrapper';
import { ReceiptCustomizerPanel } from '../settings/ReceiptCustomizerPanel';
import { Receipt } from 'lucide-react';

interface ReceiptCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptCustomizerModal: React.FC<ReceiptCustomizerModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="لوحة تخصيص شكل الفاتورة والإيصال"
      subtitle="تخصيص الحقول، الشعار، الرقم الضريبي، ملاحظات العميل، ورسالة التذييل مع معاينة فورية"
      icon={<Receipt className="w-5 h-5 text-amber-500 shrink-0" />}
      maxWidth="max-w-6xl"
      className="max-h-[92vh] flex flex-col"
    >
      <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh]">
        <ReceiptCustomizerPanel onSaved={onClose} />
      </div>
    </DraggableModalWrapper>
  );
};
