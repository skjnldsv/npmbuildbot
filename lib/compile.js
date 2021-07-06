const { exec, execFile } = require('child_process')
const { getNpmVersion } = require('./utils/getNodeVersion')

const npmSetup = async function(gitRoot, logger) {
	const fallbackNpmVersion = '6'
	const npmVersion = getNpmVersion(gitRoot, fallbackNpmVersion)

	return new Promise((resolve, reject) => {
		execFile('npm', ['i', '-g', `npm@${npmVersion}`], { cwd: gitRoot }, function(error, stdout) {
			if (error) {
				reject()
				logger.debug(error, stdout)
				return false
			}
			logger.debug(stdout)
			resolve()
			return true
		})
	})
}

const npmInstall = async function(gitRoot, logger) {
	return new Promise((resolve, reject) => {
		exec('npm ci', { cwd: gitRoot }, function(error, stdout) {
			if (error) {
				reject()
				logger.debug(error, stdout)
				return false
			}
			logger.debug(stdout)
			resolve()
			return true
		})
	})
}

const npmBuild = async function(gitRoot, logger) {
	return new Promise((resolve, reject) => {
		exec('npm run build', {
			cwd: gitRoot,
			maxBuffer: 10 * 1024 * 1024 // stdout to 10MB
		}, function(error, stdout) {
			if (error) {
				reject()
				logger.debug(error, stdout)
				return false
			}
			logger.debug(stdout)
			resolve()
			return true
		})
	})
}

module.exports = async function(gitRoot, logger) {
	try {
		// Install npm version specified in package.json engines
		logger.debug('Installing npm', gitRoot)
		await npmSetup(gitRoot, logger)

		// install deps
		logger.debug('Installing packages', gitRoot)
		await npmInstall(gitRoot, logger)

		// build app
		logger.debug('Building app', gitRoot)
		await npmBuild(gitRoot, logger)

		return true
	} catch (error) {
		throw error
	}
}
