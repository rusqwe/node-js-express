import { sql, type Request } from '../db/pool.js';
import { request as getRequest } from '../db/pool.js';

export interface Task {
    task_id: number;
    task_struct_code: number;
    task_name?: string;
    module_id?: number;
    module_name: string;
    developer_id: number;
    developer_login: string;
    developer_shortname: string;
    role_snames: string;
    role_count: string;
    row_is_ready: string;
}

// Helper для создания запроса с подключённым пулом
async function createRequest(): Promise<Request> {
    return getRequest();
}


function addInputs(req: Request, data: Task): void {
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        // Динамически добавляет поля объекта как SQL параметры
        const type = typeof value === 'number' ? sql.Int : sql.NVarChar;
        req.input(key, type, value);
    }
}

// GET /api/tasks?taskId=
export async function getTasks(id?: string): Promise<Task[]> {
    const req = await createRequest();
    if (id) {
        req.input('task_id', sql.Int, Number(id));
    }
    const result = await req.execute('[system].[task__select__data]');
    return result.recordset ?? [];
}

// GET /api/tasks/:id — получить задачу по ID
export async function getTaskById(id: string): Promise<Task | null> {
    const req = await createRequest();
    req.input('task_id', sql.Int, Number(id));
    const result = await req.execute('[system].[task__select__row]');
    return (result.recordset?.[0] ?? null) as Task | null;
}

// POST /api/tasks — создать задачу
export async function createTask(data: Task): Promise<Task> {
    const req = await createRequest();
    addInputs(req, data);
    const result = await req.execute('[system].[task__insert]');
    return result.recordset?.[0] as Task;
}

// PUT /api/tasks/:id — обновить задачу
export async function updateTask(id: string, data: Task): Promise<Task | null> {
    const req = await createRequest();
    req.input('task_id', sql.Int, Number(id));
    addInputs(req, data);
    const result = await req.execute('[system].[task__update]');
    return (result.recordset?.[0] ?? null) as Task | null;
}

// DELETE /api/tasks/:id — удалить задачу
export async function deleteTask(id: string): Promise<boolean> {
    const req = await createRequest();
    req.input('task_id', sql.Int, Number(id));
    const result = await req.execute('[system].[task__delete]');
    return (result.rowsAffected?.[0] ?? 0) > 0;
}
