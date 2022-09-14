const overtimeWork = require("../API/OvertimeWork");

function exitCoreRoutine() {
  overtimeWork.exitSave();
}

module.exports = {exitCoreRoutine};