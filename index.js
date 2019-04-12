const pr = require('./lib/pr.js')
const comment = require('./lib/comment.js')
const git = require('./lib/git.js')
const compile = require('./lib/compile.js')
const getToken = require('./lib/token.js')

module.exports = app => {
	app.on('issue_comment.created', async context => {
		const payload = context.payload

		if (!payload.issue.html_url.endsWith('pull/' + payload.issue.number)) {
			// Ignore normal issues
			app.log('NOT A PR!')
			return
		}

		const path = comment.match(payload.comment.body)
		if (path === false) {
			app.log('Ignore')
			return
		}

		comment.plusOne(context, payload.comment.id)

		if (await pr.isMerged(context, payload.issue.number)) {
		  app.log('PR is already merged just carry on')
		  return
		}


		const token = await getToken(context.payload.installation.id)
		const branch = await pr.getBranch(context)
		app.log(`Starting on branch ${branch} for path /${path}`)

		const gitRoot = await git.cloneAndCheckout(context, token, branch)
		if (!gitRoot) {
			app.log('Error during the git initialisation')
			return
		}

		console.info('compiling');
		await compile(gitRoot)

		console.info('committing');
		const success = await git.commitAndPush(context, path, branch, token, gitRoot)

		if (success) {
			app.log(`Successfully pushed commit ${success} to branch ${branch}`)
		} else {
			app.log(`Commit NOT pushed to branch ${branch}`)
		}
	})
}
