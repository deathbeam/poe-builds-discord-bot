const config = require('./config')
const { isApprover } = require('./security')

function scheduleWithFixedDelay (client, promiseCreator, delay) {
  return promiseCreator()
    .then(() => client
      .setTimeout(() => scheduleWithFixedDelay(client, promiseCreator, delay), delay))
}

async function scanReactions (client) {
  async function countReactions (message, reaction) {
    const users = await Promise.all(message.reactions
      .filter(r => r.emoji.name === reaction)
      .map(r => r.fetchUsers())
      .map(up => up.then(u => Promise.all(u.map(user => message.guild.members.get(user.id))))))

    return users
      .map(u => u.filter(u => isApprover(u)).length)
      .reduce((a, b) => a + b, 0)
  }

  function getUrlFromMessage (message) {
    return message.embeds[0].url
  }

  function findSimilarMessage (message, messages) {
    return messages.filter(m => getUrlFromMessage(message) === getUrlFromMessage(m)).first()
  }

  const submissionChannel = client.channels.find(c => c.name === config.submissionChannel)
  const approvalChannel = client.channels.find(c => c.name === config.approvedChannel)

  const approvalMessages = await approvalChannel.fetchMessages()
  const submissionMessages = await submissionChannel.fetchMessages()

  const filteredApprovalMessages = approvalMessages.filter(m => m.embeds.length > 0)
  const filteredSubmissionMessages = submissionMessages.filter(m => m.embeds.length > 0 && m.reactions.size > 0)

  return filteredSubmissionMessages.map(async message => {
    const yesReactions = await countReactions(message, config.yesReaction)
    const noReactions = await countReactions(message, config.noReaction)

    if (yesReactions > noReactions && yesReactions >= config.reactionLimit) {
      const similarMessage = findSimilarMessage(message, filteredApprovalMessages)
      const newMessage = {
        embed: message.embeds[0]
      }

      if (similarMessage) {
        return similarMessage.delete().then(() => approvalChannel.send(newMessage)).then(() => message.delete())
      } else {
        return approvalChannel.send(newMessage).then(() => message.delete())
      }
    } else if (noReactions > yesReactions && noReactions >= config.reactionLimit) {
      return message.delete()
    }

    return null
  }).filter(m => m != null)
}

module.exports = (client) => {
  scheduleWithFixedDelay(client, () => scanReactions(client), 5000)
}
