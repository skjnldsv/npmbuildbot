module.exports = {
    plusOne: async function(context, commentId) {
        const params = context.repo({content: '+1', comment_id: commentId})
        return context.github.reactions.createForIssueComment(params)
    }
}
