import {
	Field,
	Float,
	Int,
	ObjectType,
	registerEnumType
} from '@nestjs/graphql'
import { Priority, TaskStatus } from '@/prisma/generated'
import { Period } from '../analytics.service'

registerEnumType(Period, {
	name: 'Period'
})

@ObjectType()
export class StatusCount {
	@Field(() => TaskStatus)
	public status: TaskStatus

	@Field(() => Int)
	public count: number
}

@ObjectType()
export class PriorityCount {
	@Field(() => Priority, { nullable: true })
	public priority: Priority | null

	@Field(() => Int)
	public count: number
}

@ObjectType()
export class ActivityPoint {
	@Field()
	public date: Date

	@Field(() => Int)
	public count: number
}

@ObjectType()
export class ProjectStatistics {
	@Field(() => [StatusCount])
	public tasksByStatus: StatusCount[]

	@Field(() => [PriorityCount])
	public tasksByPriority: PriorityCount[]

	@Field(() => Float)
	public completionRate: number

	@Field(() => Int)
	public overdueTasks: number

	@Field(() => Int)
	public memberActivity: number

	@Field(() => [ActivityPoint])
	public activityTrend: ActivityPoint[]
}

@ObjectType()
export class LabelUsage {
	@Field()
	public id: string

	@Field()
	public name: string

	@Field()
	public color: string

	@Field(() => Int)
	public taskCount: number
}

@ObjectType()
export class AssigneeDistribution {
	@Field()
	public userId: string

	@Field()
	public displayName: string

	@Field()
	public username: string

	@Field(() => Int)
	public taskCount: number
}

@ObjectType()
export class TaskStatistics {
	@Field(() => Float)
	public avgCompletionTimeHours: number

	@Field(() => [LabelUsage])
	public popularLabels: LabelUsage[]

	@Field(() => [AssigneeDistribution])
	public assigneeDistribution: AssigneeDistribution[]
}

@ObjectType()
export class MemberActivity {
	@Field()
	public userId: string

	@Field()
	public displayName: string

	@Field()
	public username: string

	@Field({ nullable: true })
	public avatar?: string

	@Field(() => Int, { nullable: true })
	public taskCount?: number

	@Field(() => Int, { nullable: true })
	public commentCount?: number
}

@ObjectType()
export class UserLastActivity {
	@Field()
	public userId: string

	@Field()
	public displayName: string

	@Field()
	public username: string

	@Field({ nullable: true })
	public avatar?: string

	@Field()
	public lastActive: Date
}

@ObjectType()
export class UserActivityStatistics {
	@Field(() => [MemberActivity])
	public mostActiveMembersByTasks: MemberActivity[]

	@Field(() => [MemberActivity])
	public mostActiveMembersByComments: MemberActivity[]

	@Field(() => [UserLastActivity])
	public recentUserActivity: UserLastActivity[]
}
