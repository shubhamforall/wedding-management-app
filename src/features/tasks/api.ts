import { createCrudApi } from '@/lib/createCrudApi';
import type { Task, TaskInput } from './types';

const crud = createCrudApi<Task, TaskInput>('tasks');

export const fetchTasks = crud.fetchAll;
export const createTask = crud.create;
export const updateTask = crud.update;
export const deleteTask = crud.remove;
