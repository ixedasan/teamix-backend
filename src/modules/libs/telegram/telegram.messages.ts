import type { User } from '@/prisma/generated'

export const MESSAGES = {
	welcome:
		`<b>👋 Welcome to TEAMIX Bot!</b>\n\n` +
		`To receive notifications and improve your experience using the platform, let's link your Telegram account to TEAMIX.\n\n` +
		`Click the button below and go to <b>Notifications</b> to complete the setup.`,
	authSuccess:
		`<b>🎉 Success!</b>\n\n` +
		`Your Telegram account has been successfully linked to TEAMIX.`,
	invalidToken: `<b>❌ Invalid or expired token!</b>`,
	profile: (user: User) =>
		`<b>👤 User Profile:</b>\n\n` +
		`👤 User Name: <b>${user.username}</b>\n` +
		`📧 Email: <b>${user.email}</b>\n` +
		`📝 About me: <b>${user.bio || 'Not specified'}</b>\n\n` +
		`🔧 Click on the button below to go to the profile settings.`
}
