export class AppError extends Error {
    constructor(message, status = 400, errors = null) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    let status = err.status || 500;
    let message = err.message || 'Internal server error';

    if (err.name === 'PrismaClientInitializationError') {
        status = 503;
        if (message.includes('the URL must start with the protocol')) {
            message = 'Database is not configured. Set MONGO_URI in backend/.env and restart the API.';
        } else if (message.includes('Authentication failed')) {
            message = 'MongoDB connection failed. Check MONGO_URI in backend/.env, then run: npm run db:push';
        } else if (message.includes('Can\'t reach database') || message.includes('connect')) {
            message = 'Cannot connect to MongoDB. Ensure MongoDB is running and MONGO_URI is correct.';
        }
    }

    res.status(status).json({
        message,
        ...(err.errors ? { errors: err.errors } : {}),
        ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { stack: err.stack } : {}),
    });
}

export function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
