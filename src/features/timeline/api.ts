import { createCrudApi } from '@/lib/createCrudApi';
import type { TimelineEvent, TimelineEventInput } from './types';

const crud = createCrudApi<TimelineEvent, TimelineEventInput>('timeline-events');

export const fetchTimelineEvents = crud.fetchAll;
export const createTimelineEvent = crud.create;
export const updateTimelineEvent = crud.update;
export const deleteTimelineEvent = crud.remove;
