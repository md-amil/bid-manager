import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const session = (req as any).session;

    // Check if user is logged in
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }

    // If logged in but no Amazon account connected, show connect page
    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    // Check if profile is selected (skip for select-profile page)
    if (!session.selectedProfile && !req.path.startsWith('/select-profile')) {
      return res.redirect('/select-profile');
    }
    session.scopeId = session.selectedProfile.profileId
    next();
  }
}
