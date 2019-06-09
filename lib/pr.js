module.exports = {
	isMerged: async function(context, id) {
		const params = context.repo({ pull_number: id })
		const pr = await context.github.pullRequests.get(params)
		return pr.data.merged === true
	},
  
  isClosed: async function(context, id) {
		const params = context.repo({ pull_number: id })
		const pr = await context.github.pullRequests.get(params)
		return pr.data.state === 'closed'
	},

	getBranch: async function(context) {
		const pr = await this.getPR(context)
		return pr.data.head.ref
	},

	getPR: async function(context) {
		return context.github.pullRequests.get(context.issue())
	}
}
