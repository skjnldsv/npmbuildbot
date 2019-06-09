const simpleGit = require('simple-git')
const responseHandler = require('simple-git/src/git')._responseHandler

const os = require('os')
const path = require('path')
const fs = require('fs-extra')

const cloneAndCheckout = async function(context, token, branch) {
    // Get a clean folder
    const prefix = path.resolve(os.tmpdir(), 'npmbuildbot-')
    const gitRoot = await fs.mkdtemp(prefix)
    const git = simpleGit(gitRoot)
    git.silent(true)

    try {
        // Clone
        const slug = context.repo().owner + '/' + context.repo().repo
        await git.clone(`https://x-access-token:${token}@github.com/${slug}.git`, '.')

        // Setup config
        await git.addConfig('user.email', 'npmbuildbot[bot]@users.noreply.github.com')
        await git.addConfig('user.name', 'npmbuildbot[bot]')
        await git.addConfig('commit.gpgsign', 'false')
        await git.addConfig('format.signoff', 'true')

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

const commitAndPush = async function(context, path, branch, token, gitRoot, logger) {
    // init git context
    const git = simpleGit(gitRoot)
    git.silent(true)

    // Setup config
    await git.addConfig('user.email', 'npmbuildbot[bot]@users.noreply.github.com')
    await git.addConfig('user.name', 'npmbuildbot[bot]')
    await git.addConfig('commit.gpgsign', 'false')
    await git.addConfig('format.signoff', 'true')

    // status
    let status = false
    logger.debug(`Checking changes on ${path}`)
    // filter out changed files that are not in the path
    await git.raw(['status', '--porcelain', '-b', '-u', path],
        responseHandler(function(err, result) {
            if (err || result.not_added.length === 0) {
                logger.info(`Error checking changes`, err)
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
    git.add(path)
    logger.debug(`Committing assets ${path}`)
    await git.commit('Compiling assets', [], {'--signoff': null}, function(err, result) {
        if (err) {
            logger.info(`Error committing`, err)
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