import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WeddingRole } from '@/types/database';
import * as api from './api';

export const membersQueryKey = (weddingId: string) => ['members', weddingId] as const;
export const invitationsQueryKey = (weddingId: string) => ['invitations', weddingId] as const;

export function useMembers(weddingId: string) {
  return useQuery({ queryKey: membersQueryKey(weddingId), queryFn: () => api.fetchMembers(weddingId) });
}

export function usePendingInvitations(weddingId: string) {
  return useQuery({
    queryKey: invitationsQueryKey(weddingId),
    queryFn: () => api.fetchPendingInvitations(weddingId),
  });
}

export function useInviteMember(weddingId: string, weddingName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: WeddingRole }) =>
      api.inviteMember(weddingId, weddingName, email, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsQueryKey(weddingId) }),
  });
}

export function useResendInvitation(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => api.resendInvitation(invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsQueryKey(weddingId) }),
  });
}

export function useRevokeInvitation(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => api.revokeInvitation(invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitationsQueryKey(weddingId) }),
  });
}

export function useChangeMemberRole(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WeddingRole }) => api.changeMemberRole(memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersQueryKey(weddingId) }),
  });
}

export function useRemoveMember(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.removeMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersQueryKey(weddingId) }),
  });
}

export function useTransferOwnership(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currentOwnerMemberId, newOwnerMemberId }: { currentOwnerMemberId: string; newOwnerMemberId: string }) =>
      api.transferOwnership(currentOwnerMemberId, newOwnerMemberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersQueryKey(weddingId) }),
  });
}
