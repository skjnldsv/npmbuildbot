const simpleGit = require('simple-git')
const fs = require('fs-extra')

const initGitConfig = async function(git) {
	await git.addConfig('user.email','npmbuildbot-nextcloud[bot]@users.noreply.github.com')
	await git.addConfig('user.name', 'npmbuildbot-nextcloud[bot]')
	await git.addConfig('commit.gpgsign', 'false')
    await git.addConfig('format.signoff', 'true')
}

const cloneAndCheckout = async function(context, token, branch, slug, logger, gitRoot) {
	const git = simpleGit(gitRoot)
	git.silent(true)

	try {
		// clone
		await git.clone(`https://x-access-token:${token}@github.com/${slug}.git`, '.')

		// setup config
		await initGitConfig(git)

		// checkout new branch
		await git.checkout(branch)
	} catch (e) {
		logger.debug(e)
		return false
	}
	return true
}

const commitAndPush = async function(path, branch, gitRoot, logger, action) {
	// init git context
	const git = simpleGit(gitRoot)
	git.silent(true)

	// setup config
	await initGitConfig(git)

	// make sure the path is correct
	path = `./${path}`

	// status
	let status = false
	logger.debug(`Checking changes on ${path}`)

	// filter out changed files that are not in the path
	await git.status(['--porcelain', path], function(err, result) {
		// if error or if NEITHER of not_added and modified contains something
        if (err || !(result.not_added.length !== 0 || result.modified.length !== 0)) {
            logger.debug(`Error checking changes`, err, result)
            status = false
            return
        }
        status = true
    })

	if (!status) {
		return false
	}

	// process
	logger.debug(`Committing assets ${path}`)

	await git.add(path)

	let rawArgs = ['commit', '--signoff']
	if (action === 'amend') {
		rawArgs.push('--amend')
		rawArgs.push('--no-edit')
	} else if (action === 'fixup') {
		rawArgs.push('--fixup=HEAD')
	} else {
		rawArgs.push('-m')
		rawArgs.push('Compile assets')
	}
	await git.raw(rawArgs, function(err) {
		if (err) {
			logger.debug(`Error committing`, err)
			return false
		}
	})

	// pushing
	logger.debug(`Pushing to ${branch}`)
	const pushParams = {}
	if (action === 'amend') {
		pushParams['--force'] = null
	}
	await git.push('origin', branch, pushParams)

	// cleanup
	fs.remove(gitRoot)
	return true
}

module.exports = {
	cloneAndCheckout,
	commitAndPush
}
