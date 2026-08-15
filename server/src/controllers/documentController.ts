import type { Request, Response } from 'express';
import fs from 'node:fs';
import * as documentService from '../services/documentService';
import { AppError } from '../utils/AppError';
import { toCamelCaseObject } from '../utils/caseMapping';

export async function list(req: Request, res: Response) {
  const rows = await documentService.listDocuments(req.params.weddingId!);
  res.json({ success: true, documents: rows.map(toCamelCaseObject) });
}

export async function upload(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw AppError.badRequest('No file uploaded.');

  const doc = await documentService.uploadDocument({
    weddingId: req.params.weddingId!,
    uploadedBy: req.user!.id,
    originalName: file.originalname,
    category: typeof req.body.category === 'string' ? req.body.category : null,
    relatedTo: typeof req.body.relatedTo === 'string' ? req.body.relatedTo : null,
    buffer: file.buffer,
  });
  res.status(201).json({ success: true, document: toCamelCaseObject(doc) });
}

export async function download(req: Request, res: Response) {
  const { doc, absolutePath } = await documentService.getDocumentForDownload(
    req.params.id!,
    req.params.weddingId!
  );
  if (!fs.existsSync(absolutePath)) throw AppError.notFound('File no longer exists.');
  res.download(absolutePath, doc.document_name);
}

export async function updateMeta(req: Request, res: Response) {
  const doc = await documentService.updateDocumentMeta(req.params.id!, req.params.weddingId!, {
    documentName: typeof req.body.documentName === 'string' ? req.body.documentName : undefined,
    category: 'category' in req.body ? req.body.category : undefined,
    relatedTo: 'relatedTo' in req.body ? req.body.relatedTo : undefined,
    dateAdded: typeof req.body.dateAdded === 'string' ? req.body.dateAdded : undefined,
  });
  res.json({ success: true, document: toCamelCaseObject(doc!) });
}

export async function remove(req: Request, res: Response) {
  await documentService.deleteDocument(req.params.id!, req.params.weddingId!);
  res.json({ success: true });
}
