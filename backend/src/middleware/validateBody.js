import { z } from 'zod';

export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = {};
            result.error.issues.forEach((issue) => {
                const key = issue.path.join('.') || 'body';
                errors[key] = errors[key] || [];
                errors[key].push(issue.message);
            });

            return res.status(422).json({ message: 'Validation failed', errors });
        }

        req.body = result.data;
        return next();
    };
}
