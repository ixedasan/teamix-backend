import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Role } from '@/prisma/generated'

@ObjectType()
export class ProjectStatistics {
	@Field(() => Int)
	totalTasks: number

	@Field(() => Int)
	completedTasks: number

	@Field(() => Int)
	overdueTasks: number

	@Field(() => Int)
	completionRate: number

	@Field(() => Int)
	totalMembers: number

	@Field(() => Int)
	totalDocuments: number

	@Field(() => Int)
	totalComments: number

	@Field(() => Int)
	taskGrowthRate: number

	@Field(() => Int)
	avgCompletionTime: number
}

@ObjectType()
export class TaskStatusAnalytics {
	@Field(() => Int)
	backlog: number

	@Field(() => Int)
	todo: number

	@Field(() => Int)
	inProgress: number

	@Field(() => Int)
	done: number

	@Field(() => Int)
	cancelled: number

	@Field(() => Int)
	totalTasks: number
}

@ObjectType()
export class MemberProductivity {
	@Field()
	userId: string

	@Field()
	username: string

	@Field()
	displayName: string

	@Field({ nullable: true })
	avatar?: string

	@Field(() => Role)
	role: Role

	@Field(() => Int)
	assignedTasks: number

	@Field(() => Int)
	completedTasks: number

	@Field(() => Int)
	completionRate: number

	@Field(() => Int)
	commentsCount: number

	@Field(() => Date, { nullable: true })
	lastActive: Date | null

	@Field(() => Int)
	urgentTasks: number
}

@ObjectType()
class DailyCount {
	@Field()
	date: string

	@Field(() => Int)
	count: number
}

@ObjectType()
export class ProjectActivity {
	@Field(() => [DailyCount])
	tasksCreated: DailyCount[]

	@Field(() => [DailyCount])
	tasksCompleted: DailyCount[]

	@Field(() => [DailyCount])
	comments: DailyCount[]

	@Field(() => [DailyCount])
	activeUsers: DailyCount[]
}

@ObjectType()
class LabelCount {
	@Field()
	labelId: string

	@Field()
	labelName: string

	@Field()
	color: string

	@Field(() => Int)
	count: number

	@Field(() => Int)
	percentage: number
}

@ObjectType()
export class LabelDistribution {
	@Field(() => [LabelCount])
	distribution: LabelCount[]

	@Field(() => Int)
	totalLabelsUsed: number
}

@ObjectType()
export class PriorityDistribution {
	@Field(() => Int)
	none: number

	@Field(() => Int)
	low: number

	@Field(() => Int)
	medium: number

	@Field(() => Int)
	high: number

	@Field(() => Int)
	urgent: number

	@Field(() => Int)
	totalTasks: number
}

@ObjectType()
export class TaskTrend {
	@Field()
	month: string

	@Field(() => Int)
	created: number

	@Field(() => Int)
	completed: number

	@Field(() => Int)
	completionRate: number
}

@ObjectType()
export class ProjectTimeline {
	@Field(() => Date)
	projectCreatedAt: Date

	@Field(() => Date, { nullable: true })
	firstTaskCreatedAt: Date | null

	@Field({ nullable: true })
	firstTaskTitle: string | null

	@Field(() => Date, { nullable: true })
	latestCompletedTaskAt: Date | null

	@Field({ nullable: true })
	latestCompletedTaskTitle: string | null

	@Field(() => Date, { nullable: true })
	mostRecentTaskAt: Date | null

	@Field({ nullable: true })
	mostRecentTaskTitle: string | null

	@Field(() => Int)
	projectDurationDays: number
}

@ObjectType()
export class ComprehensiveProjectAnalytics {
	@Field(() => ProjectStatistics)
	statistics: ProjectStatistics

	@Field(() => TaskStatusAnalytics)
	statusDistribution: TaskStatusAnalytics

	@Field(() => [MemberProductivity])
	memberProductivity: MemberProductivity[]

	@Field(() => ProjectActivity)
	activity: ProjectActivity

	@Field(() => LabelDistribution)
	labelDistribution: LabelDistribution

	@Field(() => PriorityDistribution)
	priorityDistribution: PriorityDistribution

	@Field(() => [TaskTrend])
	taskTrends: TaskTrend[]

	@Field(() => ProjectTimeline)
	timeline: ProjectTimeline
}
