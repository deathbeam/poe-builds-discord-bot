const config = require('./config')

function isSubmitter (member) {
  return isApprover(member) || (member && member.roles.cache.find(r => r.name === config.submitterRole))
}

function isApprover (member) {
  return member && member.roles.cache.find(r => r.name === config.approverRole)
}

module.exports = {
  isApprover,
  isSubmitter
}
