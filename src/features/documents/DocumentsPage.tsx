import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Plus, Pencil, Trash2, Download, FolderOpen } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCurrentWedding } from '@/features/weddings/WeddingProvider';
import { useListOptions } from '@/hooks/useListOptions';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConfigureListsButton } from '@/features/settings/ConfigureListsButton';
import { DocumentFormDialog } from './DocumentFormDialog';
import { getDownloadUrl } from './api';
import { useDeleteDocument, useDocuments } from './hooks';
import type { DocumentRow } from './types';

function openDocument(weddingId: string, documentId: string) {
  window.open(getDownloadUrl(weddingId, documentId), '_blank', 'noopener,noreferrer');
}

export function DocumentsPage() {
  const { wedding, role } = useCurrentWedding();
  const canEdit = role !== 'viewer';
  const { data: documents, isLoading } = useDocuments(wedding.id);
  const { data: categoryOptions } = useListOptions(wedding.id, 'document_category');
  const deleteDocument = useDeleteDocument(wedding.id);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentRow | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRow | null>(null);

  const filtered = useMemo(() => {
    if (!documents) return [];
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesSearch = !q || d.document_name.toLowerCase().includes(q) || d.related_to?.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, search, categoryFilter]);

  const openCreate = () => {
    setEditingDocument(null);
    setFormOpen(true);
  };

  const openEdit = (doc: DocumentRow) => {
    setEditingDocument(doc);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<DocumentRow, any>[]>(
    () => [
      { accessorKey: 'document_name', header: 'Document Name' },
      { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'related_to', header: 'Related To', cell: ({ getValue }) => getValue<string>() || '—' },
      { accessorKey: 'date_added', header: 'Date Added', cell: ({ getValue }) => dayjs(getValue<string>()).format('DD MMM YYYY') },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <button
              aria-label="Download document"
              onClick={() => openDocument(wedding.id, row.original.id)}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
            >
              <Download className="h-4 w-4" />
            </button>
            {canEdit && (
              <>
                <button
                  aria-label="Edit document"
                  onClick={() => openEdit(row.original)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  aria-label="Delete document"
                  onClick={() => setDocumentToDelete(row.original)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-danger-bg hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canEdit]
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="p-4 pt-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Documents</h1>
          <p className="text-sm text-text-muted">{documents?.length ?? 0} files</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfigureListsButton weddingId={wedding.id} role={role} lists={[{ listType: 'document_category', label: 'Document Category' }]} />
          {canEdit && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Upload
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search name, related to..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-44">
          <option value="all">All Categories</option>
          {(categoryOptions ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.value}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={documents?.length ? 'No documents match your search' : 'No documents yet'}
          description={documents?.length ? 'Try a different search or filter.' : 'Upload your first document to get started.'}
          action={
            canEdit && !documents?.length ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Upload
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{doc.document_name}</p>
                    <p className="text-xs text-text-muted">
                      {doc.category || 'Uncategorized'} · {dayjs(doc.date_added).format('DD MMM YYYY')}
                    </p>
                  </div>
                  <button
                    aria-label="Download document"
                    onClick={() => openDocument(wedding.id, doc.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-primary hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                {doc.related_to && <p className="mt-2 text-xs text-text-muted">Related to {doc.related_to}</p>}
                {canEdit && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border-subtle pt-3">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(doc)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setDocumentToDelete(doc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} pageSize={25} />
          </div>
        </>
      )}

      <DocumentFormDialog weddingId={wedding.id} open={formOpen} onClose={() => setFormOpen(false)} document={editingDocument} />

      <ConfirmDialog
        open={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        title="Delete document?"
        description={`${documentToDelete?.document_name ?? 'This document'} will be permanently removed.`}
        confirmLabel="Delete"
        danger
        isLoading={deleteDocument.isPending}
        onConfirm={async () => {
          if (!documentToDelete) return;
          try {
            await deleteDocument.mutateAsync({ id: documentToDelete.id, storagePath: documentToDelete.storage_path });
            toast.success('Document deleted.');
            setDocumentToDelete(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete document.');
          }
        }}
      />
    </div>
  );
}
