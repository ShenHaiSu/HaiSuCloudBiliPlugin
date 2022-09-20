const zlib = require("node:zlib");
const ws = require("ws");
const axios = require("axios");
const LOG = require("./logFuncs");
const Tools = require("./toolFunc");
const Handles = require("./biliMessageHandle");
const {Event} = require("../tools/eventControl");
const danmuConfig = {
  getInfoStreamURL: "https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?", //需要使用id 直播间id
  wsURL: "",
  wsToken: "",
  RoomID: 0,
  HeartBeatDelay: 0,
  HeartBeatInterval: 0,
  HeartBeatContent: ""
};
const cmdBlackList = ["STOP_LIVE_ROOM_LIST"];
let sock = null;


function getWebSocketURL() {
  return axios({
    url: danmuConfig.getInfoStreamURL + "id=" + danmuConfig.RoomID + "&type=0",
    method: "get",
  }).then(axiosRes => {
    // 错误排查
    if (axiosRes.data['code'] !== 0) return Promise.reject(axiosRes.data.message);
    // 返回数据
    let data = axiosRes.data['data']['host_list'];
    danmuConfig.wsToken = axiosRes.data['data']['token'];
    return {err: false, wsURL: Tools.getWSAddress(data)};
  }).catch(axiosErr => {
    return {err: true, message: axiosErr.message};
  })
}

async function startConnect(appConfig) {
  // 初始化赋值
  danmuConfig.RoomID = appConfig.BiliRoomID;
  danmuConfig.HeartBeatDelay = appConfig.HeartBeatDelaySecond * 1000;
  danmuConfig.HeartBeatContent = appConfig.HeartBeatContent;
  // 获取WebSocket地址
  let axiosRes = await getWebSocketURL();
  if (axiosRes.err) return false;
  danmuConfig.wsURL = axiosRes.wsURL;
  // 信息显示
  LOG.infoLog("WSAddress：" + danmuConfig.wsURL);
  LOG.infoLog("WSToken：" + danmuConfig.wsToken);
  // 激活部署sock连接
  sock = new ws(danmuConfig.wsURL);
  sockOpened();
  Event.emit("StreamStart");
  return true;
}

function closeConnect() {
  LOG.infoLog("直播信息捕捉已关闭");
  LOG.infoLog("WS数据流通道已关闭");
  Event.emit("StreamEnd");
  try {
    sock.close();
  } catch (err) {
    LOG.errLog(err.message);
  }
  return true;
}

function sockOpened() {
  sock.on("open", () => {
    LOG.infoLog(`WS已建立通道。等待鉴权。`);
    // 发送鉴权
    let AuthPack = {
      uid:0,
      platform:"web",
      type:2,
      roomid: danmuConfig.RoomID,
      // key:danmuConfig.wsToken
    };
    sock.send(Tools.getHeader(AuthPack) + JSON.stringify(AuthPack));
    // 循环发送心跳包
    danmuConfig.HeartBeatInterval = setInterval(() => {
      sock.send(Tools.getHeader(danmuConfig.HeartBeatContent, 1, 2) + danmuConfig.HeartBeatContent);
    }, danmuConfig.HeartBeatDelay);
  });

  sock.on("message", data => {
    // 使用zlib压缩的普通包
    if (data[7] === 2 && data[11] === 5) handleNormalPackage(data);
    // 不使用压缩的普通包
    if (data[7] === 0 && data[11] === 5) handleSinglePackage(JSON.parse(data.subarray(16).toString()));
    // 认证包回复 协议1 操作8
    if (data[7] === 1 && data[11] === 8) handleSinglePackage(JSON.parse(data.subarray(16).toString()));
  })

  // WebSocket连接错误
  sock.on("error", data => {
    LOG.errLog(`WS通道出现异常，相关信息：${JSON.stringify(data.toString())}`);
  });

  // WebSocket连接关闭
  sock.on("close", data => {
    LOG.infoLog(`WS通道已关闭，关闭码：${data.toString()}`);
    clearInterval(danmuConfig.HeartBeatInterval);
  });
}

/**
 * 将需要解压和拆分的包处理后转发给单包处理.
 * @param input {Buffer} 输入流
 */
function handleNormalPackage(input) {
  let realData = input.subarray(16);
  let unzipData = zlib.unzipSync(realData);
  if (unzipData[0] === 0) {
    let handledLength = 0;
    while (handledLength < unzipData.length) {
      let packageLength = unzipData.readUint16BE(handledLength + 2);
      let singlePackLength = Buffer.from(unzipData.subarray(handledLength + 16, handledLength + packageLength)).toString();
      handleSinglePackage(JSON.parse(singlePackLength));
      handledLength += packageLength;
    }
  } else {
    handleSinglePackage(JSON.parse(unzipData.toString()));
  }
}

/**
 * 直接处理单个包对象.
 * @param input {Object} 单个信息包对象
 */
function handleSinglePackage(input) {
  // 内容过滤
  if (cmdBlackList.includes(input['cmd'])) return;
  if (!input.cmd) return LOG.infoLog("WS通道鉴权成功。");
  // 内容分发
  switch (input['cmd']) {
    case "DANMU_MSG":
      // 弹幕分发
      Handles.danmuHandle(input);
      break;
    case "SEND_GIFT":
      Handles.giftHandle(input);
      break;
    case "INTERACT_WORD":
      // 用户进入直播间
      if (input.data['msg_type'] === 1) Handles.entryHandle(input);
      // 用户关注直播间
      if (input.data['msg_type'] === 2) Handles.newSubscribeHandle(input);
      break;
    case "PREPARING":
      // 判定是本直播间下播之后会自动关闭信息流
      if (Handles.livePrepareHandle(input)) closeConnect();
      break;
    case "GUARD_BUY":
      Handles.guardBuyHandle(input);
      break;
    case "POPULARITY_RED_POCKET_START":
      Handles.redPocketStartHandle(input);
      break;
    default:
      console.log(`[ 无配信息 ] 类型：${input.cmd}`);
  }
}

module.exports = {startConnect, closeConnect};