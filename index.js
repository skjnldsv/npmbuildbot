const pr = require('./lib/pr.js')
const comment = require('./lib/comment.js')
const git = require('./lib/git.js')
const compile = require('./lib/compile.js')
const getToken = require('./lib/token.js')
const commands = require('probot-commands')

const os = require('os')
const path = require('path')
const fs = require('fs-extra')

module.exports = app => {
	const logger = app.log

	const deny = (repo, number, gitRoot) => {
		logger.info(`Invalid request: ${repo}#${number}`)
		// cleanup tmp folder
		try {
			fs.remove(gitRoot)
		} catch(error) {
			logger.debug(error)
		}
	}

	commands(app, 'compile', async (context, command) => {
		// Get a clean folder
		const prefix = path.resolve(os.tmpdir(), 'npmbuildbot-')
		const gitRoot = await fs.mkdtemp(prefix)
		
		const payload = context.payload
		const repo = payload.repository.full_name
		const number = payload.issue.number

		// PR checks
		if (!payload.issue.html_url.endsWith('pull/' + payload.issue.number)) {
			// Ignore normal issues
			logger.debug('This is not a PR')
			deny(repo, number, gitRoot)
			comment.minusOne(context, payload.comment.id)
			return
		}
		const isMerged = await pr.isMerged(context)
		const isClosed = await pr.isClosed(context)
		if (isMerged || isClosed) {
			// should not be merged
			logger.debug('PR is already merged or closed just carry on')
			deny(repo, number, gitRoot)
			comment.minusOne(context, payload.comment.id)
			return
		}

		// 2.1 command action checks
		const action = command.arguments.startsWith('amend')
			? 'amend'
			: command.arguments.startsWith('fixup')
				? 'fixup'
				: false
		if (action) {
			command.arguments = command.arguments.replace(/^(amend|fixup) /i, '')
		}

		// 2.2 command syntax checks
		if (!command.arguments || !command.arguments.startsWith('/')) {
			if (!action) {
				logger.debug('Path does not start with a / nor does it contain the fixup or amend parametter')
				comment.confused(context, payload.comment.id)
				deny(repo, number, gitRoot)
				return
			}
		}
		if (command.arguments.trim().indexOf(' ') > -1) {
			logger.debug('Path contains spaces')
			comment.confused(context, payload.comment.id)
			deny(repo, number, gitRoot)
			return
		}

		// all clear! Go go go!
		const buildPath = command.arguments.trim().substr(1)
		comment.plusOne(context, payload.comment.id)

		const token = await getToken(context.payload.installation.id)
		const branch = await pr.getBranch(context)
		logger.info(`Starting branch ${branch} with path /${buildPath} on ${repo}#${number}`)

		// 3. cloning
		const gitStatus = await git.cloneAndCheckout(context, token, branch, logger, gitRoot)
		if (!gitStatus) {
			logger.debug('Error during the git initialisation')
			deny(repo, number, gitRoot)
			return
		}

		let success = false;
		try {
			// 4. compiling app
			await compile(gitRoot, logger)

			// 5. commit and push
			success = await git.commitAndPush(buildPath, branch, gitRoot, logger, action)
			if (success) {
				logger.info(`Successfully pushed commit ${success} to branch ${branch} on ${repo}#${number}`)
				// ! waiting for official octokit support of rocket
				// ! https://github.com/octokit/rest.js/pull/1393
				// comment.rocket(context, payload.comment.id)
			}
		} catch(e) {}

		// error, closing the process :(
		if (success === false) {
			logger.debug(`The provided path /${buildPath} does not contain any changes to commit`)
			deny(repo, number, gitRoot)
			comment.confused(context, payload.comment.id)
		}
	})
}
