import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'
import * as Upload from 'graphql-upload/Upload.js'
import { Role, type Project, type User } from '@/prisma/generated'
import { Authorization } from '@/src/shared/decorators/auth.decorator'
import { Authorized } from '@/src/shared/decorators/authorized.decorator'
import { CurrentProject } from '@/src/shared/decorators/current-project.decorator'
import { RolesAccess } from '@/src/shared/decorators/role-access.decorator'
import { GqlAuthGuard } from '@/src/shared/guards/gql-auth.guard'
import { ProjectGuard } from '@/src/shared/guards/project.guard'
import { FileValidationPipe } from '@/src/shared/pipes/file-validation.pipe'
import { GqlContext } from '@/src/shared/types/gql-context.types'
import { ProjectInput } from './input/project.input'
import { ProjectModel } from './models/project.model'
import { ProjectCoreService } from './project-core.service'

@Resolver('ProjectCore')
export class ProjectCoreResolver {
	public constructor(private readonly projectCoreService: ProjectCoreService) {}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@Query(() => ProjectModel, { name: 'findProjectById' })
	public async getProjectById(@CurrentProject('id') id: string) {
		return this.projectCoreService.getProjectById(id)
	}

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
	@Mutation(() => ProjectModel, { name: 'createProject' })
	public async createProject(
		@Authorized() user: User,
		@Args('data') input: ProjectInput
	) {
		return this.projectCoreService.createProject(user, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'changeProjectInfo' })
	public async updateProject(
		@CurrentProject() project: Project,
		@Args('data') input: ProjectInput
	) {
		return this.projectCoreService.updateProject(project, input)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'deleteProject' })
	public async deleteProject(@CurrentProject() project: Project) {
		return this.projectCoreService.deleteProject(project)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'changeProjectCover' })
	public async changeCover(
		@CurrentProject() project: Project,
		@Args('cover', { type: () => GraphQLUpload }, FileValidationPipe)
		cover: Upload
	) {
		return this.projectCoreService.changeCover(project, cover)
	}

	@UseGuards(GqlAuthGuard, ProjectGuard)
	@RolesAccess(Role.ADMIN)
	@Mutation(() => Boolean, { name: 'removeProjectCover' })
	public async removeCover(@CurrentProject() project: Project) {
		return this.projectCoreService.removeCover(project)
	}
}
