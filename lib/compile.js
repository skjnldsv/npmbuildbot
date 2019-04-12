const { exec } = require('child_process')

const npmInstall = async function(gitRoot) {
	return new Promise((resolve, reject) => {
		exec('npm install', { cwd: gitRoot }, function(error) {
			if (error) {
				reject()
				return false
			}
			resolve()
			return true
		})
	})
}

const npmBuild = async function(gitRoot) {
	return new Promise((resolve, reject) => {
		exec('npm run build', { cwd: gitRoot }, function(error) {
			if (error) {
				reject()
				return false
			}
			resolve()
			return true
		})
	})
}

module.exports = async function(gitRoot) {
	try {

		// install deps
		await npmInstall(gitRoot)

		// build app
		await npmBuild(gitRoot)

		return true
	} catch (error) {
		throw error
	}
}
