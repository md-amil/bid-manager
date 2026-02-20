import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import session = require('express-session');
import FileStoreFactory from 'session-file-store';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuthGuard } from './common/guards/auth.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ─── Session ───────────────────────────────────────────────────────────────
  const FileStore = FileStoreFactory(session);
  app.use(
    session({
      store: new FileStore({
        path: './sessions',
        ttl: 24 * 60 * 60,
        retries: 0,
        logFn: () => undefined,
      }),
      secret:
        process.env.SESSION_SECRET ??
        'bid-manager-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
    }),
  );

  // ─── Global pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // auto-transform primitives
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global filters ────────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Global interceptors ───────────────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── Global guards ─────────────────────────────────────────────────────────
  // Auth guard: all /api/* routes require a valid session.
  // View routes and /auth/* are handled per-controller with @Public() if needed.
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new AuthGuard(reflector));

  // ─── View engine ───────────────────────────────────────────────────────────
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
