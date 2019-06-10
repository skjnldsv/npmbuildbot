const { exec } = require('child_process')

const npmInstall = async function(gitRoot, logger) {
	return new Promise((resolve, reject) => {
		exec('npm install', { cwd: gitRoot }, function(error, stdout) {
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
		exec('npm run build', { cwd: gitRoot }, function(error, stdout) {
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
