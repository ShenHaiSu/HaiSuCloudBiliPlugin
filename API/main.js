const LOG = require("../tools/logFuncs");
const router = require("express").Router();
const appConfig = require("../config.json");
const biliLiveDamu = require("../tools/biliLiveRoomInfo");
const {Event, Event2Web} = require("../tools/eventControl");
const liveInformation = {
  status: false,
};

// 核心基础配置的查询
router.get("/coreInfo", (req, res, next) => {
  if (!appConfig) return next(new Error("服务器内部参数错误。"));
  res.status(200);
  res.send({...appConfig, liveInformation});
});

// 切换直播状态
router.get("/statusToggle", async (req, res, next) => {
  let result = await liveStatusToggle();
  if (result.err) {
    res.status(500);
    res.send({err: true, message: result.message, liveStatus: liveInformation.status});
  } else {
    res.status(200);
    res.send({err: false, message: "切换直播监听状态成功。", liveStatus: liveInformation.status});
  }
});

// 加班插件
router.use("/overtimeWork", require("./OvertimeWork").router);

// 切换直播状态
function liveStatusToggle() {
  if (!liveInformation.status) {
    return biliLiveDamu
      .startConnect(appConfig)
      .then(feedback => {
        liveInformation.status = true;
        if (feedback) return LOG.infoLog("监听启动成功");
        let errorMessage = "监听启动失败，请检查直播间ID是否正确或者直播间是否没有权限设置";
        LOG.errLog(errorMessage);
        liveInformation.status = false;
        return {err: true, message: errorMessage};
      });
  } else {
    liveInformation.status = false;
    return biliLiveDamu.closeConnect();
  }
}

module.exports = {router, liveInformation};