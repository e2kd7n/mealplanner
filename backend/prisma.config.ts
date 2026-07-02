import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    async adapter(env: NodeJS.ProcessEnv) {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      return new PrismaPg({ connectionString: env['DATABASE_URL'] ?? '' });
    },
  },
});
