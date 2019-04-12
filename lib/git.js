const simpleGit = require('simple-git')
const responseHandler = require('simple-git/src/git')._responseHandler

const os = require('os')
const path = require('path')
const fs = require('fs-extra')


const initGit = async function(context, token, git) {
	git.silent(true)
	try {
		// Clone
		const slug = context.repo().owner + '/' + context.repo().repo
		await git.clone(`https://x-access-token:${token}@github.com/${slug}.git`, '.')

		// Setup config
		await git.addConfig('user.email', 'skjnldsv@protonmail.com')
		await git.addConfig('user.name', 'Npmbuildbot')
        await git.addConfig('commit.gpgsign', 'false')
    } catch (e) {
		throw e
    }
}

const cloneAndCheckout = async function(context, token, branch) {
	// Get a clean folder
	const prefix = path.resolve(os.tmpdir(), 'npmbuildbot-')
    const gitRoot = await fs.mkdtemp(prefix)
	const git = simpleGit(gitRoot)
    try {
        // init git context
        await initGit(context, token, git)

		// Checkout new branch
		await git.checkout(branch)
	} catch (e) {
		// Something went wrong, cleanup
        fs.remove(gitRoot)
        console.info(e);
        return false
	}
	return gitRoot
}

const commitAndPush = async function(context, path, branch, token, gitRoot) {
    // init git context
	const git = simpleGit(gitRoot)
    await initGit(context, token, git)
    
    // status
    let status = false
    await gitContext.raw(
		['status', '--porcelain', '-b', '-u', path],
		responseHandler(function(err, result) {
			if (err || result.not_added.length === 0) {
                status = false
                return
            }
            status = true
		}, 'StatusSummary')
    )
    if (!status) {
        return false
    }

    // process
    let commit = false
    await gitContext.add(path)
	await gitContext.commit('Compiling assets', function(err, result) {
        if (err) {
            return false
        }
        commit = result.commit
    })

    pushing
    await git.push('origin', branch)
    
    cleanup
    fs.remove(gitRoot)
    return commit
}

module.exports = { cloneAndCheckout, commitAndPush }
