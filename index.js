const pr = require('./lib/pr.js')
const comment = require('./lib/comment.js')
const git = require('./lib/git.js')
const compile = require('./lib/compile.js')
const getToken = require('./lib/token.js')
const commands = require('probot-commands')

module.exports = app => {
	const logger = app.log

	const deny = (repo, number) => {
		logger.info(`Invalid request: ${repo}#${number}`)
  }

	commands(app, 'compile', async (context, command) => {
		
		const payload = context.payload
		const repo = payload.repository.full_name
		const number = payload.issue.number

		// PR checks
		if (!payload.issue.html_url.endsWith('pull/' + payload.issue.number)) {
			// Ignore normal issues
			logger.debug('This is not a PR')
			deny(repo, number)
		  comment.minusOne(context, payload.comment.id)
			return
		}
    const isMerged = await pr.isMerged(context, payload.issue.number)
    const isClosed = await pr.isClosed(context, payload.issue.number)
		if (isMerged || isClosed) {
      // should not be merged
			logger.debug('PR is already merged or closed just carry on')
			deny(repo, number)
		  comment.minusOne(context, payload.comment.id)
			return
		}

		// 2. command syntax checks
		if (!command.arguments.startsWith('/')) {
			logger.debug('Path does not start with a /')
		  comment.confused(context, payload.comment.id)
			deny(repo, number)
			return
		}
		if (command.arguments.trim().indexOf(' ') > -1) {
			logger.debug('Path contains spaces')
		  comment.confused(context, payload.comment.id)
			deny(repo, number)
			return
		}

		// all clear! Go go go!
		const path = command.arguments.trim().substr(1)
		comment.plusOne(context, payload.comment.id)

		const token = await getToken(context.payload.installation.id)
		const branch = await pr.getBranch(context)
		logger.info(`Starting branch ${branch} with path /${path} on ${repo}#${number}`)

		// 3. cloning
		const gitRoot = await git.cloneAndCheckout(context, token, branch, logger)
		if (!gitRoot) {
			logger.debug('Error during the git initialisation')
			deny(repo, number)
			return
		}

		// 4. compiling app
		await compile(gitRoot, logger)

		// 5. commit and push
		const success = await git.commitAndPush(path, branch, gitRoot, logger)

		if (success) {
			logger.info(`Successfully pushed commit ${success} to branch ${branch} on ${repo}#${number}`)
		  comment.rocket(context, payload.comment.id)
		} else {
			logger.debug(`The provided path ${path} does not contain any changes to commit`)
			deny(repo, number)
		  comment.confused(context, payload.comment.id)
		}
	})
}
