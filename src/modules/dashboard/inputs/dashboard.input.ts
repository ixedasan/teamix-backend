import { Field, InputType, Int } from '@nestjs/graphql'
import { Priority, TaskStatus } from '@/prisma/generated'

@InputType()
export class DashboardFilterInput {
	@Field(() => [String], { nullable: true })
	projectIds?: string[]

	@Field(() => [TaskStatus], { nullable: true })
	statuses?: TaskStatus[]

	@Field(() => [Priority], { nullable: true })
	priorities?: Priority[]

	@Field(() => Boolean, { nullable: true })
	onlyOverdue?: boolean

	@Field(() => Boolean, { nullable: true })
	onlyUpcoming?: boolean

	@Field(() => Int, { nullable: true })
	daysRange?: number

	@Field(() => Int, { nullable: true })
	limit?: number

	@Field(() => Int, { nullable: true })
	offset?: number
}

@InputType()
export class TaskFilterInput {
	@Field(() => String, { nullable: true })
	searchTerm?: string

	@Field(() => [String], { nullable: true })
	projectIds?: string[]

	@Field(() => [TaskStatus], { nullable: true })
	statuses?: TaskStatus[]

	@Field(() => [Priority], { nullable: true })
	priorities?: Priority[]

	@Field(() => Boolean, { nullable: true })
	onlyAssignedToMe?: boolean

	@Field(() => Boolean, { nullable: true })
	onlyCreatedByMe?: boolean

	@Field(() => Boolean, { nullable: true })
	onlyOverdue?: boolean

	@Field(() => Boolean, { nullable: true })
	onlyDueToday?: boolean

	@Field(() => Boolean, { nullable: true })
	onlyDueThisWeek?: boolean

	@Field(() => Int, { nullable: true })
	limit?: number

	@Field(() => Int, { nullable: true })
	offset?: number
}
