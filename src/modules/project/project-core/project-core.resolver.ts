import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'
import * as Upload from 'graphql-upload/Upload.js'
import { Role, type User } from '@/prisma/generated'
import { Authorization } from '@/src/shared/decorators/auth.decorator'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { UseProjectGuard } from '@/src/shared/decorators/project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { FileValidationPipe } from '@/src/shared/pipes/file-validation.pipe'
import { GqlContext } from '@/src/shared/types/gql-context.types'
import { ProjectInput } from './input/project.input'
import { ProjectModel } from './models/project.model'
import { ProjectCoreService } from './project-core.service'

@Resolver('ProjectCore')
export class ProjectCoreResolver {
	public constructor(private readonly projectCoreService: ProjectCoreService) {}

	@Authorization()
	@Query(() => [ProjectModel], { name: 'getAllUserProjects' })
	public async getUserProjects(@Authorized() user: User) {
		return this.projectCoreService.gerUserProjects(user)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'setCurrentProject' })
	public async setCurrentProject(
		@Args('projectId') id: string,
		@Context() { req }: GqlContext
	) {
		return this.projectCoreService.setCurrentProject(req, id)
	}

	@Authorization()
	@Mutation(() => Boolean, { name: 'createProject' })
	public async createProject(
		@Authorized() user: User,
		@Args('data') input: ProjectInput
	) {
		return this.projectCoreService.createProject(user, input)
	}

	@Authorization()
	@UseProjectGuard()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'updateProject' })
	public async updateProject(
		@Authorized() user: User,
		@CurrentProject() projectId: string,
		@Args('data') input: ProjectInput
	) {
		return this.projectCoreService.updateProject(user, projectId, input)
	}

	@Authorization()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'deleteProject' })
	public async deleteProject(@Args('projectId') id: string) {
		return this.projectCoreService.deleteProject(id)
	}

	@Authorization()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'changeProjectCover' })
	public async changeCover(
		@Args('projectId') id: string,
		@Args('cover', { type: () => GraphQLUpload }, FileValidationPipe)
		cover: Upload
	) {
		return this.projectCoreService.changeCover(id, cover)
	}

	@Authorization()
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'removeProjectCover' })
	public async removeCover(@Args('projectId') id: string) {
		return this.projectCoreService.removeCover(id)
	}
}
