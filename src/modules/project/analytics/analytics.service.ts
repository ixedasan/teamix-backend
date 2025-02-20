import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { TaskStatus } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'

export enum Period {
	DAYS_7 = '7days',
	DAYS_30 = '30days',
	DAYS_90 = '90days',
	YEAR_1 = '1year'
}

@Injectable()
export class AnalyticsService {
	constructor(private readonly prismaService: PrismaService) {}

	private getDateRange(period: Period): { startDate: Date; endDate: Date } {
		const endDate = new Date()
		const startDate = new Date()

		switch (period) {
			case Period.DAYS_7:
				startDate.setDate(endDate.getDate() - 7)
				break
			case Period.DAYS_30:
				startDate.setDate(endDate.getDate() - 30)
				break
			case Period.DAYS_90:
				startDate.setDate(endDate.getDate() - 90)
				break
			case Period.YEAR_1:
				startDate.setFullYear(endDate.getFullYear() - 1)
				break
			default:
				startDate.setDate(endDate.getDate() - 30)
		}

		startDate.setHours(0, 0, 0, 0)
		endDate.setHours(23, 59, 59, 999)

		return { startDate, endDate }
	}

	async getProjectStatistics(projectId: string, period: Period) {
		const { startDate, endDate } = this.getDateRange(period)
		const baseFilter = {
			projectId,
			createdAt: { gte: startDate, lte: endDate }
		}

		try {
			// Get task counts by status and priority in parallel
			const [tasksByStatus, tasksByPriority, totalTasks, completedTasks] =
				await Promise.all([
					this.prismaService.task.groupBy({
						by: ['status'],
						where: baseFilter,
						_count: { id: true }
					}),
					this.prismaService.task.groupBy({
						by: ['priority'],
						where: baseFilter,
						_count: { id: true }
					}),
					this.prismaService.task.count({ where: baseFilter }),
					this.prismaService.task.count({
						where: { ...baseFilter, status: TaskStatus.DONE }
					})
				])

			// Calculate completion rate with safe division
			const completionRate = totalTasks
				? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2))
				: 0

			// Get overdue tasks
			const overdueTasks = await this.prismaService.task.count({
				where: {
					projectId,
					dueDate: { lt: new Date() },
					status: {
						notIn: [TaskStatus.DONE, TaskStatus.CANCELLED, TaskStatus.BACKLOG]
					}
				}
			})

			const memberActivity = await this.prismaService.member.count({
				where: { projectId }
			})

			// Get activity trend (task creation over time)
			const activityTrend = await this.prismaService.$queryRaw`
        SELECT DATE_TRUNC('day', "created_at") as date, COUNT(*) as count
        FROM tasks
        WHERE project_id = ${projectId} AND "created_at" BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE_TRUNC('day', "created_at")
        ORDER BY date ASC
      `

			return {
				tasksByStatus: tasksByStatus.map(item => ({
					status: item.status,
					count: item._count.id
				})),
				tasksByPriority: tasksByPriority.map(item => ({
					priority: item.priority,
					count: item._count.id
				})),
				completionRate,
				overdueTasks,
				memberActivity,
				activityTrend: Array.isArray(activityTrend) ? activityTrend : []
			}
		} catch (error) {
			console.error('Error fetching project statistics:', error)
			throw new InternalServerErrorException(
				'Failed to fetch project statistics'
			)
		}
	}

	async getTaskStatistics(projectId: string) {
		try {
			const completedTasks = await this.prismaService.task.findMany({
				where: { projectId, status: TaskStatus.DONE },
				select: { createdAt: true, updatedAt: true }
			})

			// Calculate average completion time with validation
			const avgCompletionTime =
				completedTasks.length > 0
					? completedTasks.reduce((total, task) => {
							const timeDiff =
								task.updatedAt.getTime() - task.createdAt.getTime()
							return total + Math.max(0, timeDiff)
						}, 0) /
						completedTasks.length /
						(1000 * 60 * 60) // Convert to hours
					: 0

			const popularLabels = await this.prismaService.taskLabel.findMany({
				where: { projectId },
				select: {
					id: true,
					name: true,
					color: true,
					_count: { select: { tasks: true } }
				},
				orderBy: { tasks: { _count: 'desc' } },
				take: 5
			})

			const taskDistributionByAssignee =
				await this.prismaService.taskAssignee.groupBy({
					by: ['userId'],
					where: { task: { projectId } },
					_count: { taskId: true }
				})

			const assigneeIds = taskDistributionByAssignee.map(item => item.userId)
			const users =
				assigneeIds.length > 0
					? await this.prismaService.user.findMany({
							where: { id: { in: assigneeIds } },
							select: { id: true, displayName: true, username: true }
						})
					: []

			const assigneeDistribution = taskDistributionByAssignee.map(item => {
				const user = users.find(u => u.id === item.userId)
				return {
					userId: item.userId,
					displayName: user?.displayName || 'Unknown',
					username: user?.username || 'unknown',
					taskCount: item._count.taskId
				}
			})

			return {
				avgCompletionTimeHours: parseFloat(avgCompletionTime.toFixed(2)),
				popularLabels: popularLabels.map(label => ({
					id: label.id,
					name: label.name,
					color: label.color,
					taskCount: label._count.tasks
				})),
				assigneeDistribution
			}
		} catch (error) {
			console.error('Error fetching task statistics:', error)
			throw new InternalServerErrorException('Failed to fetch task statistics')
		}
	}

	async getUserActivityStatistics(projectId: string, days: number = 30) {
		const validDays = Math.max(1, Math.min(365, days || 30))

		const endDate = new Date()
		const startDate = new Date()
		startDate.setDate(endDate.getDate() - validDays)

		try {
			const taskCreators = await this.prismaService.task.groupBy({
				by: ['createdById'],
				where: {
					projectId,
					createdAt: {
						gte: startDate,
						lte: endDate
					}
				},
				_count: {
					id: true
				},
				orderBy: {
					_count: {
						id: 'desc'
					}
				},
				take: 5
			})

			const commentActivity = await this.prismaService.comment.groupBy({
				by: ['authorId'],
				where: {
					task: { projectId },
					createdAt: {
						gte: startDate,
						lte: endDate
					}
				},
				_count: { id: true },
				orderBy: {
					_count: { id: 'desc' }
				},
				take: 5
			})

			// Get unique user IDs for efficient fetching
			const uniqueUserIds = [
				...new Set([
					...taskCreators.map(item => item.createdById),
					...commentActivity.map(item => item.authorId)
				])
			]

			// Fetch user details if there are active users
			const users =
				uniqueUserIds.length > 0
					? await this.prismaService.user.findMany({
							where: {
								id: { in: uniqueUserIds }
							},
							select: {
								id: true,
								displayName: true,
								username: true,
								avatar: true
							}
						})
					: []

			const recentUserActivity = await this.prismaService.$queryRaw`
        SELECT 
          user_id, 
          MAX(recent_activity) as last_active
        FROM (
          SELECT 
            created_by_id as user_id, 
            MAX(created_at) as recent_activity
          FROM tasks
          WHERE project_id = ${projectId}
          GROUP BY created_by_id
          
          UNION ALL
          
          SELECT 
            author_id as user_id, 
            MAX(created_at) as recent_activity
          FROM comments
          WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ${projectId})
          GROUP BY author_id
        ) as combined_activity
        GROUP BY user_id
        ORDER BY last_active DESC
        LIMIT 10
      `

			return {
				mostActiveMembersByTasks: taskCreators.map(item => {
					const user = users.find(u => u.id === item.createdById)
					return {
						userId: item.createdById,
						displayName: user?.displayName || 'Unknown',
						username: user?.username || 'unknown',
						avatar: user?.avatar,
						taskCount: item._count.id
					}
				}),
				mostActiveMembersByComments: commentActivity.map(item => {
					const user = users.find(u => u.id === item.authorId)
					return {
						userId: item.authorId,
						displayName: user?.displayName || 'Unknown',
						username: user?.username || 'unknown',
						avatar: user?.avatar,
						commentCount: item._count.id
					}
				}),
				recentUserActivity: Array.isArray(recentUserActivity)
					? recentUserActivity.map(item => {
							const user = users.find(u => u.id === item.user_id)
							return {
								userId: item.user_id,
								displayName: user?.displayName || 'Unknown',
								username: user?.username || 'unknown',
								avatar: user?.avatar,
								lastActive: new Date(item.last_active)
							}
						})
					: []
			}
		} catch (error) {
			console.error('Error fetching user activity statistics:', error)
			throw new InternalServerErrorException(
				'Failed to fetch user activity statistics'
			)
		}
	}
}
