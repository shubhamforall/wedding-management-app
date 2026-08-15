import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import {
  assertNotLastOwner,
  deleteMember,
  findMemberById,
  findMembersForWedding,
  updateMemberRole,
  type WeddingRole,
} from '../repositories/weddingMemberRepository';
import { findWeddingById } from '../repositories/weddingRepository';
import { insertNotification } from '../repositories/notificationRepository';

export async function listMembers(weddingId: string) {
  return findMembersForWedding(weddingId);
}

async function requireMemberInWedding(weddingId: string, memberId: string) {
  const member = await findMemberById(memberId);
  if (!member || member.wedding_id !== weddingId) throw AppError.notFound('Member not found.');
  return member;
}

export async function changeMemberRole(weddingId: string, memberId: string, newRole: WeddingRole) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const member = await requireMemberInWedding(weddingId, memberId);
    await assertNotLastOwner(conn, member, newRole, 'active');
    await updateMemberRole(conn, memberId, newRole);

    if (newRole !== member.role) {
      const wedding = await findWeddingById(weddingId);
      await insertNotification(
        {
          userId: member.user_id,
          weddingId,
          type: 'info',
          title: `Your role changed in ${wedding?.name ?? 'a wedding'}`,
          message: `You are now a ${newRole}`,
          link: `/w/${weddingId}`,
        },
        conn
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function removeMember(weddingId: string, memberId: string) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const member = await requireMemberInWedding(weddingId, memberId);
    await assertNotLastOwner(conn, member, null, 'removed');

    const wedding = await findWeddingById(weddingId);
    await deleteMember(conn, memberId);
    await insertNotification(
      {
        userId: member.user_id,
        weddingId,
        type: 'warning',
        title: `You were removed from ${wedding?.name ?? 'a wedding'}`,
      },
      conn
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Mirrors the frontend's existing two-step call exactly (see HANDOFF.md):
// promote-new-owner-then-demote-old-owner, in that specific order, because
// demoting first would trip the last-owner guard.
export async function transferOwnership(
  weddingId: string,
  currentOwnerMemberId: string,
  newOwnerMemberId: string
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const currentOwner = await requireMemberInWedding(weddingId, currentOwnerMemberId);
    const newOwner = await requireMemberInWedding(weddingId, newOwnerMemberId);
    if (currentOwner.role !== 'owner') throw AppError.forbidden('Only the current owner can transfer ownership.');

    const wedding = await findWeddingById(weddingId);
    const weddingName = wedding?.name ?? 'a wedding';

    await updateMemberRole(conn, newOwner.id, 'owner');
    await insertNotification(
      {
        userId: newOwner.user_id,
        weddingId,
        type: 'info',
        title: `Your role changed in ${weddingName}`,
        message: 'You are now a owner',
        link: `/w/${weddingId}`,
      },
      conn
    );

    await assertNotLastOwner(conn, currentOwner, 'member', 'active');
    await updateMemberRole(conn, currentOwner.id, 'member');
    await insertNotification(
      {
        userId: currentOwner.user_id,
        weddingId,
        type: 'info',
        title: `Your role changed in ${weddingName}`,
        message: 'You are now a member',
        link: `/w/${weddingId}`,
      },
      conn
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
