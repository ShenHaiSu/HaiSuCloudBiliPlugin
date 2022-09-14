const express = require("express");
const expressWs = require("express-ws");
const toolsFunc = require("./tools/toolFunc");
const LOG = require("./tools/logFuncs");
const {WebSocketHandle} = require("./tools/WebSocket");
const NodeCmd = require("node-cmd");
const {exitCoreRoutine} = require("./tools/exitCoreRoutine");
const {startCoreRoutine} = require("./tools/startCoreRoutine");
const app = express();
expressWs(app);
let appConfig = {
  ServerPort: 10292,
  BiliRoomID: 123,
  DefaultWorkSecond: 7200,
  HeartBeatDelaySecond: 0,
  WhiteIPList: []
};

// 自启动项目
(() => {
  try {
    appConfig = require("./config.json");
  } catch (err) {
    LOG.errLog(err.message);
    process.exit(1);
  }
  app.listen(appConfig.ServerPort, () => {
    LOG.infoLog("服务器正常启动了。");
    startCoreRoutine();
    LOG.infoLog("开启项目已执行");
  });
  NodeCmd.runSync("title 海粟云直播插件核心");
})()

// 访问记录与拦截中间件
app.use((req, res, next) => {
  LOG.infoLog(`${req.ip} 访问 ${decodeURI(req.originalUrl)}`);
  if (!appConfig.WhiteIPList.includes(req.ip)) {
    res.status(404);
    res.send("No Response.");
  } else {
    return next();
  }
});

// 挂载网页主目录
app.use("/", express.static("./page"));

// 挂载分支路由
app.use("/API", require("./API/main").router);

// 挂载静态资源
app.use("/assets/giftImg", express.static("./assets/LiveGiftImg"));

// 测试链接
app.get("/test:payload", (req, res) => {
  res.status(200);
  res.send({
    err: false,
    message: "测试通过，与服务器通信正常。",
    remoteIP: req.ip,
    remoteURL: req.url,
    payload: req.params['payload'],
    query: req.query
  });
});

// 重启核心
app.get("/restartCore", (req, res, next) => {
  // 返回1错误码 会自动重启
  res.status(200);
  res.send("收到重启请求，请刷新网页。");
  exitCoreRoutine();
  return process.exit(1);
});

// 关闭核心
app.get("/exitCore", (req, res, next) => {
  // 返回0 关闭运行
  res.status(200);
  res.send("即将关闭核心，感谢您的使用。");
  exitCoreRoutine();
  return process.exit(0);
});


app.ws("/WSLink", WebSocketHandle);

// 错误处理
function errorHandle(err, req, res, _) {
  if (res.headersSent) return;
  // 反馈信息
  res.status(500);
  res.send(err.message);
  // 记录日志
  let errorOutput = `${req.ip} 访问 ${req.originalUrl} 出现错误：\n\t${err}`;
  LOG.errLog(errorOutput);
}

app.use(errorHandle);
