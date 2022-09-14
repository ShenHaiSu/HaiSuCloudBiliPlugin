const LOG = require("./logFuncs");
const {Event, Event2Web} = require("./eventControl");
const {liveInformation} = require("../API/main");

function WebSocketHandle(sock) {
  sock.send(JSON.stringify({type: "message", data: "WebSocket连接已建立"}));
  sock.send(JSON.stringify({type: "liveStreamStatus", status: liveInformation.status}));
  LOG.infoLog("WS通道已打开");

  sock.on("message", data => {
    LOG.infoLog(data.toString());
  });

  sock.on("close", () => {
    // 本次链接断开，删除事件监听
    Event2Web.removeListener("OvertimeWork-changeTime", overtimeWork_changeTime);
    Event2Web.removeListener("OvertimeWork-changeModList", overtimeWork_changeModList);
    Event2Web.removeListener("OvertimeWork-freshPage", overtimeWork_freshPage);
    Event.removeListener("StreamStart", StreamStartHandle);
    Event.removeListener("StreamEnd", StreamEndHandle);
    LOG.infoLog("网页链接断开");
  });

  // 监听开播 下播
  let StreamStartHandle = () => {
    sock.send(JSON.stringify({type: "StreamStart"}));
    LOG.infoLog("开播监控启动");
  }
  Event.on("StreamStart", StreamStartHandle);

  let StreamEndHandle = () => {
    sock.send(JSON.stringify({type: "StreamEnd"}));
    LOG.infoLog("直播监控已关闭");
  }
  Event.on("StreamEnd", StreamEndHandle);

  // 加班插件 - 时间变动
  Event2Web.on("OvertimeWork-changeTime", overtimeWork_changeTime);

  function overtimeWork_changeTime(data) {
    sock.send(JSON.stringify({type: "OvertimeWork-changeTime", timeLeft: data}));
  }

  // 加班插件 - 加班道具列表变动
  Event2Web.on("OvertimeWork-changeModList", overtimeWork_changeModList);

  function overtimeWork_changeModList(data) {
    sock.send(JSON.stringify({type: "OvertimeWork-changeModList", data}));
  }


  // 加班插件 - 强制刷新事件
  Event2Web.on("OvertimeWork-freshPage", overtimeWork_freshPage);

  function overtimeWork_freshPage() {
    sock.send(JSON.stringify({type: "overtimeWork_freshPage"}));
  }

  // debug使用 每一秒钟都发一次ws信息
  // setInterval(() => {
  //   sock.send(JSON.stringify({type:"test",test:"test内容"}));
  // },1000);
}


module.exports = {WebSocketHandle};