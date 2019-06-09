const simpleGit = require('simple-git')
const responseHandler = require('simple-git/src/git')._responseHandler

const os = require('os')
const path = require('path')
const fs = require('fs-extra')

const initGitConfig = async function(git) {
	await git.addConfig('user.email','npmbuildbot[bot]@users.noreply.github.com')
	await git.addConfig('user.name', 'npmbuildbot[bot]')
	await git.addConfig('commit.gpgsign', 'false')
    await git.addConfig('format.signoff', 'true')
}

const cloneAndCheckout = async function(context, token, branch, logger) {
	// Get a clean folder
	const prefix = path.resolve(os.tmpdir(), 'npmbuildbot-')
	const gitRoot = await fs.mkdtemp(prefix)
	const git = simpleGit(gitRoot)
	git.silent(true)

	try {
		// clone
		const slug = context.repo().owner + '/' + context.repo().repo
		await git.clone(`https://x-access-token:${token}@github.com/${slug}.git`, '.')

		// setup config
		await initGitConfig(git)

		// checkout new branch
		await git.checkout(branch)
	} catch (e) {
		// something went wrong, cleanup
		fs.remove(gitRoot)
		logger.debug(e)
		return false
	}
	return gitRoot
}

const commitAndPush = async function(path, branch, gitRoot, logger) {
	// init git context
	const git = simpleGit(gitRoot)
	git.silent(true)

    // setup config
    await initGitConfig(git)

	// status
	let status = false
    logger.debug(`Checking changes on ${path}`)
    
	// filter out changed files that are not in the path
	await git.raw(['status', '--porcelain', '-b', '-u', path], responseHandler(function(err, result) {
        if (err || result.not_added.length === 0) {
            logger.debug(`Error checking changes`, err)
            status = false
            return
        }
        status = true
    }, 'StatusSummary'))

	if (!status) {
		return false
	}

	// process
    let commit = false
    logger.debug(`Committing assets ${path}`)

    git.add(path)
    await git.commit('Compiling assets', [], { '--signoff': null }, function(err, result) {
        if (err) {
            logger.debug(`Error committing`, err)
            return false
        }
        commit = result.commit
    })

	// pushing
	logger.debug(`Pushing to ${branch}`)
	await git.push('origin', branch)

	// cleanup
	fs.remove(gitRoot)
	return commit
}

module.exports = {
	cloneAndCheckout,
	commitAndPush
}
