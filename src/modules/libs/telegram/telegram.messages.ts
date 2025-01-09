import type { User } from '@/prisma/generated'

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

	notificationSettings: (settings: any) => `
<b>🔔 Notification Settings</b>

Current Configuration:
• Task Assignments: ${settings.taskNotifications ? '✅' : '❌'}
• Due Date Reminders: ${settings.dueDateNotifications ? '✅' : '❌'}
• Comments: ${settings.commentNotifications ? '✅' : '❌'}
• Project Updates: ${settings.projectNotifications ? '✅' : '❌'}

Use the buttons below to adjust your notification preferences.
`,

	errorMessage: `
<b>⚠️ Something went wrong</b>

An error occurred while processing your request. Please try again later or contact support if the issue persists.
`
}
