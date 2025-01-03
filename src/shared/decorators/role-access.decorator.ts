import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import { Role } from '@/prisma/generated'
import { GqlRoleGuard } from '../guards/gql-role.guard'

export function RolesAccess(...roles: Role[]) {
	return applyDecorators(SetMetadata('roles', roles), UseGuards(GqlRoleGuard))
}
