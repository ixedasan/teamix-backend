import { applyDecorators, UseGuards } from '@nestjs/common'
import { ProjectGuard } from '../guards/project.guard'

export function UseProjectGuard() {
	return applyDecorators(UseGuards(ProjectGuard))
}
