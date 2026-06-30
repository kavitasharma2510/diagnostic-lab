import '../src/config/env.js';
import { runDataCleanup } from '../src/services/dataCleanup.service.js';

runDataCleanup()
    .then((summary) => {
        console.log('Cleanup complete:', summary);
        process.exit(0);
    })
    .catch((err) => {
        console.error('Cleanup failed:', err);
        process.exit(1);
    });
