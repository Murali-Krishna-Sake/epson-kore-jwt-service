import { buildApp } from '../src/app';

// Vercel serverless entrypoint. The Express app is constructed once per
// lambda instance (cold start) and reused across warm invocations.
export default buildApp();
