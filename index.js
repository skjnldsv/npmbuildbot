const pr = require('./lib/pr.js')
const comment = require('./lib/comment.js')
const git = require('./lib/git.js')
const compile = require('./lib/compile.js')
const getToken = require('./lib/token.js')
const commands = require('probot-commands')

module.exports = app => {
  const logger = app.log
  
  const deny = (repo, number) => logger.info(`Invalid request: ${repo}#${number}`)
  
  commands(app, 'compile', async (context, command) => {
    // Checking if this is a PR
		const payload = context.payload
    const repo = payload.repository.full_name
    const number = payload.issue.number
    
    if (!payload.issue.html_url.endsWith('pull/' + payload.issue.number)) {
			// Ignore normal issues
			logger.debug('This is not a PR')
      deny(repo, number)
			return
		}
    
    // Command syntax checks    
    if (!command.arguments.startsWith('/')) {
      logger.debug('Path does not start with a /')
      deny(repo, number)
      return
    }
    
    if (command.arguments.trim().indexOf(' ') > -1) {
      logger.debug('Path contains spaces')
      deny(repo, number)
      return
    }
    
    // all clear! Go go go!
    const path = command.arguments.trim().substr(1)
		comment.plusOne(context, payload.comment.id)

		if (await pr.isMerged(context, payload.issue.number)) {
		  logger.debug('PR is already merged just carry on')
      deny(repo, number)
		  return
		}


		const token = await getToken(context.payload.installation.id)
		const branch = await pr.getBranch(context)
		logger.info(`Starting branch ${branch} with path /${path} on ${repo}#${number} `)

		// cloning
		const gitRoot = await git.cloneAndCheckout(context, token, branch)
		if (!gitRoot) {
			logger.debug('Error during the git initialisation')
      deny(repo, number)
			return
		}

		// compiling app
		await compile(gitRoot, logger)

		// commit and push
		const success = await git.commitAndPush(context, path, branch, token, gitRoot, logger)

		if (success) {
			logger.info(`Successfully pushed commit ${success} to branch ${branch} on ${repo}#${number}`)
		} else {
			logger.debug(`The provided path ${path} does not contain any changes to commit`)
      deny(repo, number)
		}
  })
}
