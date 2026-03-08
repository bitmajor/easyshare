import { neon } from '@neondatabase/serverless';

// Use direct neon connection over HTTP for serverless scalability (no pool required)
export const query = neon(process.env.DATABASE_URL!);
export default query;
