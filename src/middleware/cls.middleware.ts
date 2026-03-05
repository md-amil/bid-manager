import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.cls.run(() => {
      const session = (req as any).session;
      
      if (session) {
        if (session.selectedProfile?.profileId) {
          this.cls.set('scopeId', session.selectedProfile.profileId);
        }
        if (session.accessToken) {
          this.cls.set('accessToken', session.accessToken);
        }
        if (session.userId) {
          this.cls.set('userId', session.userId);
        }
        if (session.organizationId) {
          this.cls.set('organizationId', session.organizationId);
        }
      }
      
      next();
    });
  }
}
