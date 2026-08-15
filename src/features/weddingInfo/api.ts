import { api } from '@/lib/api';
import { toCamelCaseObject, toSnakeCaseArray } from '@/lib/caseMapping';
import type {
  EmergencyContact,
  EmergencyContactInput,
  ImportantNumber,
  ImportantNumberInput,
  WeddingInfoInput,
} from './types';

export async function updateWeddingInfo(weddingId: string, input: WeddingInfoInput) {
  await api.patch(`/weddings/${weddingId}`, toCamelCaseObject(input));
}

export async function fetchEmergencyContacts(weddingId: string): Promise<EmergencyContact[]> {
  const { items } = await api.get<{ items: Record<string, unknown>[] }>(
    `/weddings/${weddingId}/emergency-contacts`
  );
  return toSnakeCaseArray<EmergencyContact>(items);
}

export async function createEmergencyContact(weddingId: string, input: EmergencyContactInput) {
  await api.post(`/weddings/${weddingId}/emergency-contacts`, toCamelCaseObject(input));
}

export async function updateEmergencyContact(weddingId: string, id: string, input: EmergencyContactInput) {
  await api.patch(`/weddings/${weddingId}/emergency-contacts/${id}`, toCamelCaseObject(input));
}

export async function deleteEmergencyContact(weddingId: string, id: string) {
  await api.delete(`/weddings/${weddingId}/emergency-contacts/${id}`);
}

export async function fetchImportantNumbers(weddingId: string): Promise<ImportantNumber[]> {
  const { items } = await api.get<{ items: Record<string, unknown>[] }>(
    `/weddings/${weddingId}/important-numbers`
  );
  return toSnakeCaseArray<ImportantNumber>(items);
}

export async function createImportantNumber(weddingId: string, input: ImportantNumberInput) {
  await api.post(`/weddings/${weddingId}/important-numbers`, toCamelCaseObject(input));
}

export async function updateImportantNumber(weddingId: string, id: string, input: ImportantNumberInput) {
  await api.patch(`/weddings/${weddingId}/important-numbers/${id}`, toCamelCaseObject(input));
}

export async function deleteImportantNumber(weddingId: string, id: string) {
  await api.delete(`/weddings/${weddingId}/important-numbers/${id}`);
}
