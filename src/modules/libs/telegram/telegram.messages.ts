import type { User } from '@/prisma/generated'
import { SessionMetadata } from '@/src/shared/types/session-metadata.types'

interface TaskStats {
	total: number
	overdue: number
	inProgress: number
	completed: number
}

export const MESSAGES = {
	welcome: `
<b>👋 Welcome to TEAMIX Bot!</b>

TEAMIX Bot helps you stay updated with your projects and tasks right here in Telegram. Link your account to:
• Receive task assignments and updates
• Get deadline reminders
• Manage notifications
• View your tasks and projects

To get started, go to TEAMIX <b>Notification Settings</b> and complete the Telegram connection.
`,

	authSuccess: `
<b>🎉 Connection Successful!</b>

Your Telegram account is now linked to TEAMIX. You'll receive:
• Task assignments and updates
• Deadline reminders
• Project notifications
• Team mentions

Use the buttons below to:
• View your assigned tasks
• Check your profile
• Configure notifications
• Access TEAMIX webapp
`,

	invalidToken: `
<b>❌ Connection Failed</b>

The authentication token is invalid or has expired. This can happen if:
• The token has already been used
• The token has expired
• The token is incorrect

Please generate a new token in TEAMIX's notification settings and try again.
`,

	profile: (user: User, taskStats?: TaskStats) => `
<b>👤 Profile Information</b>

📝 Display Name: <b>${user.displayName}</b>
👤 Username: <b>${user.username}</b>
📧 Email: <b>${user.email}</b>
${user.bio ? `\n📌 About:\n${user.bio}` : ''}

${
	taskStats
		? `
📊 <b>Task Statistics</b>
• Total Tasks: ${taskStats.total}
• In Progress: ${taskStats.inProgress}
• Overdue: ${taskStats.overdue}
• Completed: ${taskStats.completed}
`
		: ''
}

🔐 Account Security:
• Email Verification: ${user.isEmailVerified ? '✅' : '❌'}
• Two-Factor Auth: ${user.isTotpEnabled ? '✅' : '❌'}
`,

	taskNotFound: `
<b>❌ Task Not Found</b>

The requested task couldn't be found. It may have been:
• Deleted
• Moved to another project
• Unassigned from you
`,

	resetPassword: (token: string, metadata: SessionMetadata) =>
		`<b>🔒 Password reset</b>

		You have requested a password reset for your account on the <b>TEAMIX</b> platform.

		To create a new password, please click on the following link:
		<b><a href="https://teamix.app/account/recovery/${token}">Reset password</a></b>

		📅 <b>Date of request:</b> ${new Date().toLocaleDateString()} in ${new Date().toLocaleTimeString()}

		🖥️ <b>Request information:</b>

		🌍 <b>Location:</b> ${metadata.location.country}, ${metadata.location.city}
		📱 <b>OS</b> ${metadata.device.os}
		🌐 <b>Browser:</b> ${metadata.device.browser}
		💻 <b>IP address:</b> ${metadata.ip}

		If you did not make this request, just ignore this message.

		Thank you for using <b>TEAMIX</b>! 🚀`,

	projectInvitation: (
		projectName: string,
		projectRole: string,
		token: string
	) => `
		<b>🎯 Project Invitation</b>

		You've been invited to join a project.

		• Project: ${projectName}
		• Role: ${projectRole}

		In order to accept the invitation, please click on the following link:
		<b><a href="https://teamix.app//project/join?token=${token}">Accept invitation</a></b>

		If you don't want to accept the invitation, please ignore this message.

		Thank you for using <b>TEAMIX</b>! 🚀
`,

	taskAssigned: (taskTitle: string, projectName: string) => `\
		<b>📋 New Task Assignment</b>

		You've been assigned a new task:
		• Task: ${taskTitle}
		• Project: ${projectName}
`,

	taskOverdue: (
		taskTitle: string,
		projectName: string,
		dueDate: Date,
		priority: string
	) => `
		<b>⚠️ Task Overdue Alert</b>

		The following task is overdue:
		• Task: ${taskTitle}
		• Project: ${projectName}
		• Due Date: ${dueDate}
		${priority ? `• Priority: ${priority}` : ''}

		Please update the task status or request an extension.
`,
	enableTwoFactor:
		`🔐 Ensure your safety!\n\n` +
		`Enable two-factor authentication in the <a href="https://teamix.app/dashboard/settings">account settings</a>.`,

	errorMessage: `
<b>⚠️ Something went wrong</b>

An error occurred while processing your request. Please try again later or contact support if the issue persists.
`
}
