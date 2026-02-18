import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import session = require('express-session');
import FileStoreFactory from 'session-file-store';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure session
  // app.use(
  //   session({
  //     secret: process.env.SESSION_SECRET || 'amazon-bid-manager-secret-key-change-in-production',
  //     resave: true,
  //     saveUninitialized: true,
  //     cookie: {
  //       maxAge: 24 * 60 * 60 * 1000, // 24 hours
  //       // httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //     },
  //   }),
  // );

  const FileStore = FileStoreFactory(session);

  app.use(
    session({
      store: new FileStore({
        path: './sessions',
        ttl: 24 * 60 * 60,
        retries: 0,
        logFn: function () {
          console.log('session store');
        },
      }),
      secret:
        process.env.SESSION_SECRET ||
        'amazon-bid-manager-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  // Configure EJS
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
