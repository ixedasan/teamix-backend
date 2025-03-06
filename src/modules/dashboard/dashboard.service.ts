import { Injectable } from '@nestjs/common'
import { Priority, TaskStatus } from '@/prisma/generated'
import { PrismaService } from '@/src/core/prisma/prisma.service'
import { DashboardFilterInput, TaskFilterInput } from './inputs/dashboard.input'

@Injectable()
export class DashboardService {
	public constructor(private readonly prismaService: PrismaService) {}

	async getDashboardSummary(userId: string, filter?: DashboardFilterInput) {
		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		const [
			totalAssignedTasks,
			tasksByStatus,
			tasksByPriority,
			tasksByDueDate,
			projectsSummary,
			recentTasks,
			upcomingDeadlines
		] = await Promise.all([
			this.getTotalAssignedTasks(userId, projectIds),
			this.getTasksByStatus(userId, projectIds),
			this.getTasksByPriority(userId, projectIds),
			this.getTasksByDueDate(userId, projectIds),
			this.getProjectsTasksSummary(userId, projectIds),
			this.getRecentTasks(userId, filter),
			this.getUpcomingDeadlines(userId, filter)
		])

		return {
			totalAssignedTasks,
			tasksByStatus,
			tasksByPriority,
			tasksByDueDate,
			projectsSummary,
			recentTasks,
			upcomingDeadlines
		}
	}

	private async getUserProjects(userId: string) {
		return this.prismaService.member.findMany({
			where: { userId },
			select: { projectId: true }
		})
	}

	private async getTotalAssignedTasks(userId: string, projectIds: string[]) {
		return this.prismaService.taskAssignee.count({
			where: {
				userId,
				task: {
					projectId: { in: projectIds }
				}
			}
		})
	}

	private async getTasksByStatus(userId: string, projectIds: string[]) {
		const taskStatuses = Object.values(TaskStatus)
		const results = await Promise.all(
			taskStatuses.map(async status => {
				const count = await this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							status
						}
					}
				})
				return { status, count }
			})
		)
		return results
	}

	private async getTasksByPriority(userId: string, projectIds: string[]) {
		const priorities = [...Object.values(Priority), null]
		const results = await Promise.all(
			priorities.map(async priority => {
				const count = await this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							priority: priority as Priority | null
						}
					}
				})
				return { priority, count }
			})
		)
		return results
	}

	private async getTasksByDueDate(userId: string, projectIds: string[]) {
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const endOfToday = new Date(today)
		endOfToday.setHours(23, 59, 59, 999)

		const endOfWeek = new Date(today)
		endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
		endOfWeek.setHours(23, 59, 59, 999)

		const [overdue, dueToday, dueThisWeek, upcoming, noDueDate] =
			await Promise.all([
				// Overdue tasks
				this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							dueDate: { lt: today },
							status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
						}
					}
				}),
				// Tasks due today
				this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							dueDate: {
								gte: today,
								lte: endOfToday
							},
							status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
						}
					}
				}),
				// Tasks due this week
				this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							dueDate: {
								gt: endOfToday,
								lte: endOfWeek
							},
							status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
						}
					}
				}),
				// Upcoming tasks
				this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							dueDate: { gt: endOfWeek },
							status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
						}
					}
				}),
				// Tasks with no due date
				this.prismaService.taskAssignee.count({
					where: {
						userId,
						task: {
							projectId: { in: projectIds },
							dueDate: null,
							status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
						}
					}
				})
			])

		return { overdue, dueToday, dueThisWeek, upcoming, noDueDate }
	}

	async getProjectsTasksSummary(userId: string, projectIds?: string[]) {
		let userProjectIds = projectIds
		if (!userProjectIds) {
			const userProjects = await this.getUserProjects(userId)
			userProjectIds = userProjects.map(p => p.projectId)
		}

		const projects = await this.prismaService.project.findMany({
			where: {
				id: { in: userProjectIds },
				members: {
					some: {
						userId
					}
				}
			},
			include: {
				tasks: {
					select: {
						id: true,
						status: true,
						assignees: {
							where: {
								userId
							}
						}
					}
				}
			}
		})

		return projects.map(project => {
			const assignedTasks = project.tasks.filter(
				task => task.assignees.length > 0
			)
			const totalTasks = assignedTasks.length
			const completedTasks = assignedTasks.filter(
				task => task.status === TaskStatus.DONE
			).length
			const pendingTasks = totalTasks - completedTasks

			return {
				project: {
					id: project.id,
					name: project.name,
					description: project.description,
					cover: project.cover,
					icon: project.icon,
					createdAt: project.createdAt,
					updatedAt: project.updatedAt,
					plan: project.plan
				},
				totalTasks,
				completedTasks,
				pendingTasks
			}
		})
	}

	private async getRecentTasks(userId: string, filter?: DashboardFilterInput) {
		const limit = filter?.limit || 5
		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		return this.prismaService.task.findMany({
			where: {
				projectId: { in: projectIds },
				assignees: {
					some: {
						userId
					}
				},
				status: filter?.statuses ? { in: filter.statuses } : undefined,
				priority: filter?.priorities ? { in: filter.priorities } : undefined
			},
			orderBy: { updatedAt: 'desc' },
			take: limit,
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				labels: true,
				project: true,
				createdBy: true
			}
		})
	}

	private async getUpcomingDeadlines(
		userId: string,
		filter?: DashboardFilterInput
	) {
		const limit = filter?.limit || 5
		const daysRange = filter?.daysRange || 7
		const today = new Date()
		const futureDate = new Date(today)
		futureDate.setDate(today.getDate() + daysRange)

		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		return this.prismaService.task.findMany({
			where: {
				projectId: { in: projectIds },
				assignees: {
					some: {
						userId
					}
				},
				status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
				dueDate: {
					gte: today,
					lte: futureDate
				}
			},
			orderBy: { dueDate: 'asc' },
			take: limit,
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				labels: true,
				project: true,
				createdBy: true
			}
		})
	}

	async getAssignedTasks(userId: string, filter?: TaskFilterInput) {
		const limit = filter?.limit || 10
		const offset = filter?.offset || 0
		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		const baseWhere: any = {
			projectId: { in: projectIds },
			assignees: {
				some: {
					userId
				}
			}
		}

		if (filter?.statuses?.length) {
			baseWhere.status = { in: filter.statuses }
		}

		if (filter?.priorities?.length) {
			baseWhere.priority = { in: filter.priorities }
		}

		if (filter?.searchTerm) {
			baseWhere.OR = [
				{ title: { contains: filter.searchTerm, mode: 'insensitive' } },
				{ description: { contains: filter.searchTerm, mode: 'insensitive' } }
			]
		}

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const endOfToday = new Date(today)
		endOfToday.setHours(23, 59, 59, 999)

		const endOfWeek = new Date(today)
		endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
		endOfWeek.setHours(23, 59, 59, 999)

		if (filter?.onlyOverdue) {
			baseWhere.dueDate = { lt: today }
			baseWhere.status = { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
		} else if (filter?.onlyDueToday) {
			baseWhere.dueDate = {
				gte: today,
				lte: endOfToday
			}
			baseWhere.status = { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
		} else if (filter?.onlyDueThisWeek) {
			baseWhere.dueDate = {
				gt: endOfToday,
				lte: endOfWeek
			}
			baseWhere.status = { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
		}

		return this.prismaService.task.findMany({
			where: baseWhere,
			orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
			skip: offset,
			take: limit,
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				labels: true,
				comments: true,
				attachments: true,
				links: true,
				project: true,
				createdBy: true
			}
		})
	}

	async getCreatedTasks(userId: string, filter?: TaskFilterInput) {
		const limit = filter?.limit || 10
		const offset = filter?.offset || 0
		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		return this.prismaService.task.findMany({
			where: {
				projectId: { in: projectIds },
				createdById: userId,
				status: filter?.statuses?.length ? { in: filter.statuses } : undefined,
				priority: filter?.priorities?.length
					? { in: filter.priorities }
					: undefined
			},
			orderBy: { updatedAt: 'desc' },
			skip: offset,
			take: limit,
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				labels: true,
				project: true,
				createdBy: true
			}
		})
	}

	async getOverdueTasks(userId: string, filter?: TaskFilterInput) {
		const limit = filter?.limit || 10
		const offset = filter?.offset || 0
		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const baseWhere: any = {
			projectId: { in: projectIds },
			dueDate: { lt: today },
			status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
		}

		// Only tasks assigned to me
		if (filter?.onlyAssignedToMe) {
			baseWhere.assignees = {
				some: {
					userId
				}
			}
		} else if (filter?.onlyCreatedByMe) {
			baseWhere.createdById = userId
		} else {
			baseWhere.project = {
				members: {
					some: {
						userId
					}
				}
			}
		}

		return this.prismaService.task.findMany({
			where: baseWhere,
			orderBy: { dueDate: 'asc' },
			skip: offset,
			take: limit,
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				labels: true,
				project: true,
				createdBy: true
			}
		})
	}

	async getUpcomingTasks(userId: string, filter?: TaskFilterInput) {
		const limit = filter?.limit || 10
		const offset = filter?.offset || 0
		const userProjects = await this.getUserProjects(userId)
		const projectIds = filter?.projectIds || userProjects.map(p => p.projectId)

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const daysRange = 7
		const futureDate = new Date(today)
		futureDate.setDate(today.getDate() + daysRange)

		const baseWhere: any = {
			projectId: { in: projectIds },
			dueDate: {
				gte: today,
				lte: futureDate
			},
			status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] }
		}

		if (filter?.onlyAssignedToMe) {
			baseWhere.assignees = {
				some: {
					userId
				}
			}
		} else if (filter?.onlyCreatedByMe) {
			baseWhere.createdById = userId
		} else {
			baseWhere.project = {
				members: {
					some: {
						userId
					}
				}
			}
		}

		return this.prismaService.task.findMany({
			where: baseWhere,
			orderBy: { dueDate: 'asc' },
			skip: offset,
			take: limit,
			include: {
				assignees: {
					include: {
						user: true
					}
				},
				labels: true,
				project: true,
				createdBy: true
			}
		})
	}
}
