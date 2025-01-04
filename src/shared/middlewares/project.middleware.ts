import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class ProjectMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const projectIdFromCookie = req.cookies['projectId']

		if (projectIdFromCookie) {
			req.session.projectId = projectIdFromCookie
		}

		next()
	}
}
