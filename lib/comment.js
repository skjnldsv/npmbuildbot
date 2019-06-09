module.exports = {
	plusOne: async function(context, commentId) {
		const params = context.repo({ content: '+1', comment_id: commentId })
		return context.github.reactions.createForIssueComment(params)
	},
	minusOne: async function(context, commentId) {
		const params = context.repo({ content: '-1', comment_id: commentId })
		return context.github.reactions.createForIssueComment(params)
	},
	confused: async function(context, commentId) {
		const params = context.repo({ content: 'confused', comment_id: commentId })
		return context.github.reactions.createForIssueComment(params)
	},
	rocket: async function(context, commentId) {
		const params = context.repo({ content: 'rocket', comment_id: commentId })
		return context.github.reactions.createForIssueComment(params)
	}
}
