import { AppError } from '../middleware/errorHandler.js';

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function parseId(id, label = 'id') {
    const value = String(id ?? '').trim();
    if (!OBJECT_ID_RE.test(value)) {
        throw new AppError(`Invalid ${label}.`, 400);
    }
    return value;
}

export function parseIds(ids, label = 'ids') {
    if (!Array.isArray(ids) || !ids.length) {
        throw new AppError(`Invalid ${label}.`, 400);
    }
    return ids.map((id) => parseId(id, label));
}
