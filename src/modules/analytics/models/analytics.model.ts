import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { Role } from '@/prisma/generated'

@ObjectType()
export class ProjectStatistics {
	@Field(() => Int)
	public totalTasks: number

	@Field(() => Int)
	public completedTasks: number

	@Field(() => Int)
	public overdueTasks: number

	@Field(() => Int)
	public completionRate: number

	@Field(() => Int)
	public totalMembers: number

	@Field(() => Int)
	public totalDocuments: number

	@Field(() => Int)
	public totalComments: number

	@Field(() => Int)
	public taskGrowthRate: number

	@Field(() => Int)
	public avgCompletionTime: number
}

@ObjectType()
export class TaskStatusAnalytics {
	@Field(() => Int)
	public backlog: number

	@Field(() => Int)
	public todo: number

	@Field(() => Int)
	public inProgress: number

	@Field(() => Int)
	public done: number

	@Field(() => Int)
	public cancelled: number

	@Field(() => Int)
	public totalTasks: number
}

@ObjectType()
export class MemberProductivity {
	@Field()
	public userId: string

	@Field()
	public username: string

	@Field()
	public displayName: string

	@Field({ nullable: true })
	public avatar?: string

	@Field(() => Role)
	public role: Role

	@Field(() => Int)
	public assignedTasks: number

	@Field(() => Int)
	public completedTasks: number

	@Field(() => Int)
	public completionRate: number

	@Field(() => Int)
	public commentsCount: number

	@Field(() => Date, { nullable: true })
	public lastActive: Date | null

	@Field(() => Int)
	public urgentTasks: number
}

@ObjectType()
class DailyCount {
	@Field()
	public date: string

	@Field(() => Int)
	public count: number
}

@ObjectType()
export class ProjectActivity {
	@Field(() => [DailyCount])
	public tasksCreated: DailyCount[]

	@Field(() => [DailyCount])
	public tasksCompleted: DailyCount[]

	@Field(() => [DailyCount])
	public comments: DailyCount[]

	@Field(() => [DailyCount])
	public activeUsers: DailyCount[]
}

@ObjectType()
class LabelCount {
	@Field()
	public labelId: string

	@Field()
	public labelName: string

	@Field()
	public color: string

	@Field(() => Int)
	public count: number

	@Field(() => Int)
	public percentage: number
}

@ObjectType()
export class LabelDistribution {
	@Field(() => [LabelCount])
	public distribution: LabelCount[]

	@Field(() => Int)
	public totalLabelsUsed: number
}

@ObjectType()
export class PriorityDistribution {
	@Field(() => Int)
	public none: number

	@Field(() => Int)
	public low: number

	@Field(() => Int)
	public medium: number

	@Field(() => Int)
	public high: number

	@Field(() => Int)
	public urgent: number

	@Field(() => Int)
	public totalTasks: number
}

@ObjectType()
export class TaskTrend {
	@Field()
	public month: string

	@Field(() => Int)
	public created: number

	@Field(() => Int)
	public completed: number

	@Field(() => Int)
	public completionRate: number
}

@ObjectType()
export class ProjectTimeline {
	@Field(() => Date)
	public projectCreatedAt: Date

	@Field(() => Date, { nullable: true })
	public firstTaskCreatedAt: Date | null

	@Field({ nullable: true })
	public firstTaskTitle: string | null

	@Field(() => Date, { nullable: true })
	public latestCompletedTaskAt: Date | null

	@Field({ nullable: true })
	public latestCompletedTaskTitle: string | null

	@Field(() => Date, { nullable: true })
	public mostRecentTaskAt: Date | null

	@Field({ nullable: true })
	public mostRecentTaskTitle: string | null

	@Field(() => Int)
	public projectDurationDays: number
}

@ObjectType()
export class ComprehensiveProjectAnalytics {
	@Field(() => ID)
	public id: string

	@Field(() => ProjectStatistics)
	public statistics: ProjectStatistics

	@Field(() => TaskStatusAnalytics)
	public statusDistribution: TaskStatusAnalytics

	@Field(() => [MemberProductivity])
	public memberProductivity: MemberProductivity[]

	@Field(() => ProjectActivity)
	public activity: ProjectActivity

	@Field(() => LabelDistribution)
	public labelDistribution: LabelDistribution

	@Field(() => PriorityDistribution)
	public priorityDistribution: PriorityDistribution

	@Field(() => [TaskTrend])
	public taskTrends: TaskTrend[]

	@Field(() => ProjectTimeline)
	public timeline: ProjectTimeline
}
