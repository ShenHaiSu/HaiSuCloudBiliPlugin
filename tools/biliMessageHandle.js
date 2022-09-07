const LOG = require("./logFuncs");
const {Event} = require("../tools/eventControl");

// 弹幕捕获
function danmuHandle(input) {
  let message = `[ 直播弹幕 ] ${input.info[2][1]}: ${input.info[1]}`;
  LOG.liveMessageLog(message);
  Event.emit("Live-Danmu", input, message);
}

// 礼物处理
function giftHandle(input) {
  let data = input.data;
  let message = `[ 直播礼物 ] ${data['uname']} ${data['action']} ${data['giftName']} x${data['num']}`;
  LOG.liveMessageLog(message);
  Event.emit("Live-Gift", input, message);
}

// 新观众入场信息
function entryHandle(input) {
  let message = `[ 入场信息 ] ${input.data['uname']} 进入直播间.`;
  // LOG.liveMessageLog(message);
  // console.log(message);
  Event.emit("Live-Entry", input, message);
}

// 新关注信息
function newSubscribeHandle(input) {
  let message = `[ 新增关注 ] ${input.data['uname']} 关注了直播间!`;
  LOG.liveMessageLog(message);
  Event.emit("Live-NewSubscribe", input, message);
}

function guardBuyHandle(input) {
  let message = `[ 新员登船 ] ${input.data['username']} 购买了 ${input.data['gift_name']} x${input.data['num']}`;
  LOG.liveMessageLog(message);
  Event.emit("Live-GuardBuy", input, message);
}

// 直播间进入准备阶段
function livePrepareHandle(input) {
  let appConfig = require("../config.json");
  if (input['roomid'] !== appConfig.BiliRoomID) return false;
  LOG.liveMessageLog("[ 直播关闭 ] 当前关注的直播间进入准备模式，自动关闭信息流");
  LOG.infoLog("[ 直播关闭 ] 当前关注的直播间进入准备模式，自动关闭信息流");
  return true;
}


module.exports = {
  danmuHandle,
  giftHandle,
  entryHandle,
  newSubscribeHandle,
  livePrepareHandle,
  guardBuyHandle
};