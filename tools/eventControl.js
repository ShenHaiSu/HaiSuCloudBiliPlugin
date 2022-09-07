const NodeEvent = require("node:events");
// 基础事件对象，目标指向基本针对后端内的通信
const Event = new NodeEvent();
// 向前事件对象，目标指向基本针对前端数据更新
const Event2Web = new NodeEvent();

module.exports = {Event, Event2Web};