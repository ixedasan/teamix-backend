import { Injectable } from '@nestjs/common'
import { CacheService } from '@/src/core/cache/cache.service'
import { PrismaService } from '@/src/core/prisma/prisma.service'

@Injectable()
export class AnalyticsService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly cacheService: CacheService
	) {}

	private getCacheKey(projectId: string, method: string): string {
		return `project:${projectId}:analytics:${method}`
	}

	async getCachedData<T>(
		projectId: string,
		method: string,
		fetchFn: () => Promise<T>,
		ttl: string = '5m'
	): Promise<T> {
		const cacheKey = this.getCacheKey(projectId, method)

		const cachedData = await this.cacheService.get(cacheKey)

		if (cachedData) {
			return cachedData
		}

		const freshData = await fetchFn()
		await this.cacheService.set(cacheKey, freshData, ttl)
		return freshData
	}

	async getProjectStatistics(projectId: string) {
		const [
			totalTasks,
			completedTasks,
			overdueTasks,
			totalMembers,
			totalDocuments,
			totalComments,
			createdLastMonth,
			completedLastMonth
		] = await Promise.all([
			// Total tasks count
			this.prismaService.task.count({ where: { projectId } }),

			// Completed tasks count
			this.prismaService.task.count({
				where: { projectId, status: 'DONE' }
			}),

			// Overdue tasks count
			this.prismaService.task.count({
				where: {
					projectId,
					dueDate: { lt: new Date() },
					status: { notIn: ['DONE', 'CANCELLED'] }
				}
			}),

			// Members count
			this.prismaService.member.count({ where: { projectId } }),

			// Documents count
			this.prismaService.document.count({ where: { projectId } }),

			// Comments count
			this.prismaService.comment.count({
				where: { task: { projectId } }
			}),

			// Tasks created last month
			this.prismaService.task.count({
				where: {
					projectId,
					createdAt: {
						gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
					}
				}
			}),

			// Tasks completed last month
			this.prismaService.task.count({
				where: {
					projectId,
					status: 'DONE',
					updatedAt: {
						gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
					}
				}
			})
		])

		// Calculate completion rate
		const completionRate =
			totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

		// Calculate month-over-month growth
		const taskGrowthRate =
			createdLastMonth > 0
				? Math.round((completedLastMonth / createdLastMonth) * 100)
				: 0

		// Calculate average time to completion - last 30 completed tasks
		const completedTasksData = await this.prismaService.task.findMany({
			where: {
				projectId,
				status: 'DONE'
			},
			orderBy: {
				updatedAt: 'desc'
			},
			take: 30,
			select: {
				createdAt: true,
				updatedAt: true
			}
		})

		// Calculate average time to completion in days
		let avgCompletionTime = 0
		if (completedTasksData.length > 0) {
			const totalCompletionTime = completedTasksData.reduce((sum, task) => {
				return sum + (task.updatedAt.getTime() - task.createdAt.getTime())
			}, 0)
			avgCompletionTime = Math.round(
				totalCompletionTime / completedTasksData.length / (1000 * 60 * 60 * 24)
			)
		}

		return {
			totalTasks,
			completedTasks,
			overdueTasks,
			completionRate,
			totalMembers,
			totalDocuments,
			totalComments,
			taskGrowthRate,
			avgCompletionTime
		}
	}

	async getTaskStatusDistribution(projectId: string) {
		// Get counts for each status
		const statusCounts = await this.prismaService.task.groupBy({
			by: ['status'],
			where: { projectId },
			_count: true
		})

		// Create the response object with all possible statuses
		const result = {
			backlog: 0,
			todo: 0,
			inProgress: 0,
			done: 0,
			cancelled: 0,
			totalTasks: 0
		}

		// Fill in the actual counts
		statusCounts.forEach(statusCount => {
			const count = statusCount._count
			result.totalTasks += count

			switch (statusCount.status) {
				case 'BACKLOG':
					result.backlog = count
					break
				case 'TODO':
					result.todo = count
					break
				case 'IN_PROGRESS':
					result.inProgress = count
					break
				case 'DONE':
					result.done = count
					break
				case 'CANCELLED':
					result.cancelled = count
					break
			}
		})

		return result
	}

	async getMemberProductivity(projectId: string, timeframe?: string) {
		// Define the date range based on timeframe
		const dateFilter = {}
		if (timeframe) {
			const now = new Date()
			switch (timeframe) {
				case 'week':
					const weekAgo = new Date()
					weekAgo.setDate(now.getDate() - 7)
					dateFilter['gte'] = weekAgo
					break
				case 'month':
					const monthAgo = new Date()
					monthAgo.setMonth(now.getMonth() - 1)
					dateFilter['gte'] = monthAgo
					break
				case 'quarter':
					const quarterAgo = new Date()
					quarterAgo.setMonth(now.getMonth() - 3)
					dateFilter['gte'] = quarterAgo
					break
			}
		}

		// Get project members
		const members = await this.prismaService.member.findMany({
			where: { projectId },
			include: {
				user: {
					select: {
						id: true,
						username: true,
						displayName: true,
						avatar: true
					}
				}
			}
		})

		// Get productivity metrics for each member
		const productivity = await Promise.all(
			members.map(async member => {
				const [
					assignedTasks,
					completedTasks,
					comments,
					lastActive,
					urgentTasks
				] = await Promise.all([
					// Assigned tasks count
					this.prismaService.taskAssignee.count({
						where: {
							userId: member.userId,
							task: {
								projectId,
								...(Object.keys(dateFilter).length > 0 && {
									createdAt: dateFilter
								})
							}
						}
					}),

					// Completed tasks count
					this.prismaService.taskAssignee.count({
						where: {
							userId: member.userId,
							task: {
								projectId,
								status: 'DONE',
								...(Object.keys(dateFilter).length > 0 && {
									updatedAt: dateFilter
								})
							}
						}
					}),

					// Comments count
					this.prismaService.comment.count({
						where: {
							authorId: member.userId,
							task: { projectId },
							...(Object.keys(dateFilter).length > 0 && {
								createdAt: dateFilter
							})
						}
					}),

					// Last activity date
					this.prismaService.comment.findFirst({
						where: {
							authorId: member.userId,
							task: { projectId }
						},
						orderBy: {
							createdAt: 'desc'
						},
						select: {
							createdAt: true
						}
					}),

					// Urgent tasks count
					this.prismaService.taskAssignee.count({
						where: {
							userId: member.userId,
							task: {
								projectId,
								priority: 'URGENT',
								status: { notIn: ['DONE', 'CANCELLED'] }
							}
						}
					})
				])

				// Calculate completion rate
				const completionRate =
					assignedTasks > 0
						? Math.round((completedTasks / assignedTasks) * 100)
						: 0

				return {
					userId: member.userId,
					username: member.user.username,
					displayName: member.user.displayName,
					avatar: member.user.avatar,
					role: member.role,
					assignedTasks,
					completedTasks,
					completionRate,
					commentsCount: comments,
					lastActive: lastActive?.createdAt || null,
					urgentTasks
				}
			})
		)

		return productivity
	}

	async getProjectActivity(projectId: string, days: number = 30) {
		// Calculate start date
		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		// Get daily data for tasks created
		const tasksCreated = await this.prismaService.$queryRaw`
			SELECT DATE(created_at) as date, COUNT(*) as count
			FROM tasks
			WHERE project_id = ${projectId}
			AND created_at >= ${startDate}
			GROUP BY DATE(created_at)
			ORDER BY date ASC
		`

		// Get daily data for tasks completed
		const tasksCompleted = await this.prismaService.$queryRaw`
			SELECT DATE(updated_at) as date, COUNT(*) as count
			FROM tasks
			WHERE project_id = ${projectId}
			AND status = 'DONE'
			AND updated_at >= ${startDate}
			GROUP BY DATE(updated_at)
			ORDER BY date ASC
		`

		// Get daily data for comments
		const comments = await this.prismaService.$queryRaw`
			SELECT DATE(c.created_at) as date, COUNT(*) as count
			FROM comments c
			JOIN tasks t ON c.task_id = t.id
			WHERE t.project_id = ${projectId}
			AND c.created_at >= ${startDate}
			GROUP BY DATE(c.created_at)
			ORDER BY date ASC
		`

		// Get daily active users
		const activeUsers = await this.prismaService.$queryRaw`
			SELECT DATE(c.created_at) as date, COUNT(DISTINCT c.author_id) as count
			FROM comments c
			JOIN tasks t ON c.task_id = t.id
			WHERE t.project_id = ${projectId}
			AND c.created_at >= ${startDate}
			GROUP BY DATE(c.created_at)
			ORDER BY date ASC
		`

		// Process and convert all results to ensure integer counts
		return {
			tasksCreated: (tasksCreated as any[]).map(item => ({
				date: item.date.toISOString().split('T')[0],
				count: parseInt(item.count.toString(), 10)
			})),
			tasksCompleted: (tasksCompleted as any[]).map(item => ({
				date: item.date.toISOString().split('T')[0],
				count: parseInt(item.count.toString(), 10)
			})),
			comments: (comments as any[]).map(item => ({
				date: item.date.toISOString().split('T')[0],
				count: parseInt(item.count.toString(), 10)
			})),
			activeUsers: (activeUsers as any[]).map(item => ({
				date: item.date.toISOString().split('T')[0],
				count: parseInt(item.count.toString(), 10)
			}))
		}
	}

	async getLabelDistribution(projectId: string) {
		// Get all labels for the project
		const labels = await this.prismaService.taskLabel.findMany({
			where: { projectId },
			select: {
				id: true,
				name: true,
				color: true,
				_count: {
					select: {
						tasks: true
					}
				}
			}
		})

		// Get total tasks count for percentage calculation
		const totalTasks = await this.prismaService.task.count({
			where: { projectId }
		})

		return {
			distribution: labels.map(label => ({
				labelId: label.id,
				labelName: label.name,
				color: label.color,
				count: label._count.tasks,
				percentage:
					totalTasks > 0
						? Math.round((label._count.tasks / totalTasks) * 100)
						: 0
			})),
			totalLabelsUsed: labels.reduce(
				(sum, label) => sum + label._count.tasks,
				0
			)
		}
	}

	async getPriorityDistribution(projectId: string) {
		// Get counts for each priority
		const priorityCounts = await this.prismaService.task.groupBy({
			by: ['priority'],
			where: { projectId },
			_count: true
		})

		// Get total tasks count
		const totalTasks = await this.prismaService.task.count({
			where: { projectId }
		})

		// Create the response object with all possible priorities
		const result = {
			none: 0,
			low: 0,
			medium: 0,
			high: 0,
			urgent: 0,
			totalTasks
		}

		// Fill in the actual counts
		priorityCounts.forEach(priorityCount => {
			if (priorityCount.priority === null) {
				result.none = priorityCount._count
			} else {
				switch (priorityCount.priority) {
					case 'NONE':
						result.none = priorityCount._count
						break
					case 'LOW':
						result.low = priorityCount._count
						break
					case 'MEDIUM':
						result.medium = priorityCount._count
						break
					case 'HIGH':
						result.high = priorityCount._count
						break
					case 'URGENT':
						result.urgent = priorityCount._count
						break
				}
			}
		})

		return result
	}

	async getTaskTrends(projectId: string, months: number = 3) {
		const startDate = new Date()
		startDate.setMonth(startDate.getMonth() - months)

		// Get monthly task data
		const monthlyData = await this.prismaService.$queryRaw`
			SELECT 
				DATE_TRUNC('month', created_at) as month,
				COUNT(*) as created,
				SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed
			FROM tasks
			WHERE project_id = ${projectId}
			AND created_at >= ${startDate}
			GROUP BY DATE_TRUNC('month', created_at)
			ORDER BY month ASC
		`

		return (monthlyData as any[]).map(item => ({
			month: new Date(item.month).toISOString().substring(0, 7), // Format as YYYY-MM
			created: Number(item.created),
			completed: Number(item.completed),
			completionRate:
				Number(item.created) > 0
					? Math.round((Number(item.completed) / Number(item.created)) * 100)
					: 0
		}))
	}

	async getProjectTimeline(projectId: string) {
		const project = await this.prismaService.project.findUnique({
			where: { id: projectId },
			select: {
				createdAt: true,
				tasks: {
					orderBy: { createdAt: 'asc' },
					take: 1,
					select: { createdAt: true }
				}
			}
		})

		// Get first and most recent milestone dates
		const [earliestTask, latestCompletedTask, newestTask, totalTimespan] =
			await Promise.all([
				// First task
				this.prismaService.task.findFirst({
					where: { projectId },
					orderBy: { createdAt: 'asc' },
					select: { createdAt: true, title: true }
				}),

				// Latest completed task
				this.prismaService.task.findFirst({
					where: {
						projectId,
						status: 'DONE'
					},
					orderBy: { updatedAt: 'desc' },
					select: { updatedAt: true, title: true }
				}),

				// Most recently created task
				this.prismaService.task.findFirst({
					where: { projectId },
					orderBy: { createdAt: 'desc' },
					select: { createdAt: true, title: true }
				}),

				// Calculate project timespan in days
				this.prismaService.task.aggregate({
					where: {
						projectId,
						status: 'DONE'
					},
					_max: { updatedAt: true },
					_min: { createdAt: true }
				})
			])

		// Calculate total project duration in days
		let projectDuration = 0
		if (totalTimespan._min.createdAt && totalTimespan._max.updatedAt) {
			projectDuration = Math.round(
				(totalTimespan._max.updatedAt.getTime() -
					totalTimespan._min.createdAt.getTime()) /
					(1000 * 60 * 60 * 24)
			)
		}

		return {
			projectCreatedAt: project.createdAt,
			firstTaskCreatedAt: earliestTask?.createdAt || null,
			firstTaskTitle: earliestTask?.title || null,
			latestCompletedTaskAt: latestCompletedTask?.updatedAt || null,
			latestCompletedTaskTitle: latestCompletedTask?.title || null,
			mostRecentTaskAt: newestTask?.createdAt || null,
			mostRecentTaskTitle: newestTask?.title || null,
			projectDurationDays: projectDuration
		}
	}

	async getComprehensiveProjectAnalytics(projectId: string) {
		const analyticsData = await this.getCachedData(
			projectId,
			'comprehensive',
			async () => {
				const [
					statistics,
					statusDistribution,
					memberProductivity,
					activity,
					labelDistribution,
					priorityDistribution,
					taskTrends,
					timeline
				] = await Promise.all([
					this.getProjectStatistics(projectId),
					this.getTaskStatusDistribution(projectId),
					this.getMemberProductivity(projectId, 'month'),
					this.getProjectActivity(projectId, 30),
					this.getLabelDistribution(projectId),
					this.getPriorityDistribution(projectId),
					this.getTaskTrends(projectId, 3),
					this.getProjectTimeline(projectId)
				])

				return {
					statistics,
					statusDistribution,
					memberProductivity,
					activity,
					labelDistribution,
					priorityDistribution,
					taskTrends,
					timeline
				}
			},
			'5m'
		)

		return analyticsData
	}
}
