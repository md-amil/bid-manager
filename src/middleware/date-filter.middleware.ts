import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { buildQueryWindow } from 'src/utils/query';

export interface IDateFilter {
  period: string;
  startDate?: string;
  endDate?: string;
}

const periodWindow = {
  'today': 0,
  'yesterday': 1,
  'monthly': 29,
  'last30days': 29,
  'thisWeek': 6,
  'weekly': 6,
  'last7days': 6,
  'daily': 0
}


@Injectable()
export class DateFilterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const session = (req as any).session;
    // Initialize dateFilter in session if not exists
    if (!session.dateFilter) {
      session.dateFilter = {
        period: 'today'
      };
      session.dateWindow = buildQueryWindow(0);
      next();
    }
    const { period, startDate, endDate } = req.query;
    if(period=='custom'){
      session.dateWindow = {$gte: startDate, $lte: endDate}
      next();
    }
    session.dateWindow = buildQueryWindow(periodWindow[period as string]);
    if (period) {
      session.dateFilter = {
        period: period as string,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined
      };
    }
    res.locals.dateFilter = session.dateFilter;
    res.locals.dateFilterQueryString = this.buildQueryString(session.dateFilter);
    next();
  }

  private buildQueryString(dateFilter: IDateFilter): string {
    const params = new URLSearchParams();
    params.set('period', dateFilter.period);
    if (dateFilter.startDate) {
      params.set('startDate', dateFilter.startDate);
    }
    if (dateFilter.endDate) {
      params.set('endDate', dateFilter.endDate);
    }
    return params.toString();
  }
}
