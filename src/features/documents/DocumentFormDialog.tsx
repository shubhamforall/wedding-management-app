import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { UploadCloud } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useListOptions } from '@/hooks/useListOptions';
import { useUpdateDocumentMeta, useUploadDocument } from './hooks';
import type { DocumentMetaInput, DocumentRow } from './types';

const emptyValues: DocumentMetaInput = {
  document_name: '',
  category: '',
  related_to: '',
  date_added: dayjs().format('YYYY-MM-DD'),
};

export function DocumentFormDialog({
  weddingId,
  open,
  onClose,
  document: editingDocument,
}: {
  weddingId: string;
  open: boolean;
  onClose: () => void;
  document: DocumentRow | null;
}) {
  const { data: categoryOptions } = useListOptions(weddingId, 'document_category');
  const uploadDocument = useUploadDocument(weddingId);
  const updateDocumentMeta = useUpdateDocumentMeta(weddingId);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DocumentMetaInput>({ defaultValues: emptyValues });

  useEffect(() => {
    if (open) {
      setFile(null);
      reset(editingDocument ? { ...editingDocument } : emptyValues);
    }
  }, [open, editingDocument, reset]);

  const isPending = uploadDocument.isPending || updateDocumentMeta.isPending;

  const onSubmit = async (values: DocumentMetaInput) => {
    try {
      if (editingDocument) {
        await updateDocumentMeta.mutateAsync({ id: editingDocument.id, meta: values });
        toast.success('Document updated.');
      } else {
        if (!file) {
          toast.error('Choose a file to upload.');
          return;
        }
        await uploadDocument.mutateAsync({ file, meta: values });
        toast.success('Document uploaded.');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save document.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={editingDocument ? 'Edit Document' : 'Upload Document'}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {!editingDocument && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">File</label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border px-4 py-8 text-center hover:border-primary">
              <UploadCloud className="h-6 w-6 text-text-muted" />
              <span className="text-sm text-text-muted">{file ? file.name : 'Click to choose a file'}</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !editingDocument) setValue('document_name', f.name);
                }}
              />
            </label>
          </div>
        )}

        <Input
          label="Document Name"
          error={errors.document_name?.message}
          {...register('document_name', { required: 'Document name is required' })}
        />

        <Select label="Category" {...register('category')}>
          <option value="">— Select —</option>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>

        <Input label="Related To" placeholder="e.g. vendor name, function" {...register('related_to')} />
        <Input label="Date Added" type="date" {...register('date_added', { required: true })} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {editingDocument ? 'Save Changes' : 'Upload'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
