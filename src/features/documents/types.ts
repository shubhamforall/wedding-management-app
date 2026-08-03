export interface DocumentRow {
  id: string;
  wedding_id: string;
  document_name: string;
  category: string | null;
  related_to: string | null;
  storage_path: string;
  uploaded_by: string | null;
  date_added: string;
  created_at: string;
}

export interface DocumentMetaInput {
  document_name: string;
  category: string | null;
  related_to: string | null;
  date_added: string;
}
