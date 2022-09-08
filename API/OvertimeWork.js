const express = require("express");
const router = express.Router();
const pluginConfig = require("../data/OvertimeWork.json");
const {saveDataFile, getDataFile} = require("../tools/toolFunc");
const LOG = require("../tools/logFuncs");
const {Event, Event2Web} = require("../tools/eventControl");
const dataFileList = ["OvertimeWork.temp.json", "OvertimeWork.json"];
const opcode = ["add", "reduce", "multi", "division", "power","clear"];
let tempInfo = {
  intervalFlag: 0,
  currentWorkTime: 0,
  modList: [],
  tempGiftList: []
};

(() => {
  // 启动项目
  tempInfo = getDataFile("OvertimeWork.temp.json", tempInfo);
  tempInfo.intervalFlag = 0;
})()

// 挂载中间件
router.use(express.json());

// 获取基础信息
router.get("/getInfo", (req, res, next) => {
  res.status(200);
  let output = {...pluginConfig, ...tempInfo};
  delete output.intervalFlag;
  return res.send(output);
});

// 修改加班道具
router.post("/updateModList", (req, res, next) => {
  // 判断传入内容是否合规
  if (!Array.isArray(req.body)) return next(new Error("传入数据不合规"));
  if (req.body.length === 0) return next(new Error("传入数据长度不能为0"));
  // 数据过滤
  let data = req.body.filter(item => {
    if (!item['giftName'] || !item['count'] || !item['timeChange'] || !item['type']) return false;
    if (typeof item['giftName'] !== "string") return false;
    if (typeof item['type'] !== "string") return false;
    if (typeof item['count'] !== "number") return false;
    if (typeof item['timeChange'] !== "number") return false;
    if (item['timeChange'] <= 0) return false;
    return opcode.includes(item['type']);
  });
  if (data.length < 1) return next(new Error("传入数据均不合规"));
  // 内容修改和赋予
  data = data.map(item => {
    // 数字取整
    item['count'] = Math.floor(item['count']);
    item['timeChange'] = Math.floor(item['timeChange']);
    // 赋予图标地址
    item['img'] = null;
    for (let i = 0; i < pluginConfig.giftName2Img.length; i++) {
      if (pluginConfig.giftName2Img[i].giftName !== item['giftName']) continue;
      item['img'] = pluginConfig.giftName2Img[i].imgURL;
    }
    // 返回内容
    return item;
  })
  // 其他流程
  tempInfo.modList = data;
  res.status(200);
  res.send(data);
  Event2Web.emit("OvertimeWork-changeModList", tempInfo.modList);
  return saveDataFile(dataFileList[0], tempInfo);
});

// 重置加班时间为默认
router.post("/resetTime", (req, res) => {
  tempInfo.currentWorkTime = pluginConfig.defaultWorkTime;
  res.status(200);
  res.send("重置完毕");
  Event2Web.emit("OvertimeWork-changeTime", tempInfo.currentWorkTime);
  return saveDataFile(dataFileList[0], tempInfo);
});

// 快捷操作
router.post("/fastMod", (req, res, next) => {
  if (!req.body['modCount']) return next(new Error("缺失重要参数"));
  let modCount = parseInt(req.body['modCount'] + "");
  tempInfo.currentWorkTime += modCount;
  if (tempInfo.currentWorkTime <= 0) tempInfo.currentWorkTime = 0;
  Event2Web.emit("OvertimeWork-changeTime", tempInfo.currentWorkTime);
  saveDataFile(dataFileList[0], {...tempInfo, intervalFlag: null});
  res.status(200);
  res.send("完成修改");
});

// 直播开始
Event.on("StreamStart", () => {
  tempInfo.intervalFlag = setInterval(() => {
    tempInfo.currentWorkTime--;
    if (tempInfo.currentWorkTime > 0) return;
    tempInfo.currentWorkTime = 0;
    Event2Web.emit("OvertimeWork-changeTime", 0);
  }, 1000);
});

// 直播结束
Event.on("StreamEnd", () => {
  clearInterval(tempInfo.intervalFlag);
  saveDataFile(dataFileList[0], tempInfo);
});

// 直播礼物
Event.on("Live-Gift", (input, message) => {
  // 检查礼物是否属于加班道具
  let modItemIndex = tempInfo.modList.findIndex(item => item['giftName'] === input.data['giftName']);
  if (modItemIndex === -1) return; // 不属于加班道具
  // 更新缓存区数据
  let tempItemIndex = tempInfo.tempGiftList.findIndex(item => item['giftName'] === input.data['giftName']);
  if (tempItemIndex === -1) {
    // 缓存区没见过这个礼物
    tempInfo.tempGiftList.push({
      "giftName": input.data['giftName'],
      "count": input.data['num']
    });
    tempItemIndex = tempInfo.tempGiftList.length - 1;
  } else {
    // 缓存区见过这个礼物
    tempInfo.tempGiftList[tempItemIndex].count += input.data['num'];
  }
  // 处理时间变动
  timeModHandle(modItemIndex, tempItemIndex);
  // 保存配置
  saveDataFile(dataFileList[0], {...tempInfo, intervalFlag: null});
});

// 新员登船
Event.on("Live-GuardBuy", (input, message) => {
  // 检查礼物是否属于加班道具
  let modItemIndex = tempInfo.modList.findIndex(item => item['giftName'] === input.data['gift_name']);
  if (modItemIndex === -1) return; // 不属于加班道具
  // 更新缓存区数据
  let tempItemIndex = tempInfo.tempGiftList.findIndex(item => item['giftName'] === input.data['gift_name']);
  if (tempItemIndex === -1) {
    // 缓存区没见过这个礼物
    tempInfo.tempGiftList.push({
      "giftName": input.data['gift_name'],
      "count": input.data['num']
    });
    tempItemIndex = tempInfo.tempGiftList.length - 1;
  } else {
    // 缓存区见过这个礼物
    tempInfo.tempGiftList[tempItemIndex].count += input.data['num'];
  }
  // 处理时间变动
  timeModHandle(modItemIndex, tempItemIndex);
  // 保存配置
  saveDataFile(dataFileList[0], {...tempInfo, intervalFlag: null});
});

// 处理时间变动
function timeModHandle(modItemIndex, tempItemIndex) {
  // 初始化
  let modItem = tempInfo.modList[modItemIndex];
  let tempItem = tempInfo.tempGiftList[tempItemIndex];
  // 获取触发次数
  let targetCount = Math.floor(tempItem.count / modItem.count);
  // 设定缓存区剩余数量
  tempItem.count = tempItem.count % modItem.count;
  // 修改当前剩余时间
  switch (modItem.type) {
    case "add":
      tempInfo.currentWorkTime += modItem.timeChange * targetCount;
      break;
    case "reduce":
      tempInfo.currentWorkTime -= modItem.timeChange * targetCount;
      break;
    case "multi":
      tempInfo.currentWorkTime *= modItem.timeChange * targetCount;
      break;
    case "division":
      tempInfo.currentWorkTime = Math.floor(tempInfo.currentWorkTime / modItem.timeChange * targetCount);
      break;
    case "power":
      tempInfo.currentWorkTime = Math.pow(tempInfo.currentWorkTime, modItem.timeChange);
      break;
    case "clear":
      tempInfo.currentWorkTime = pluginConfig.defaultWorkTime;
      break;
  }
  tempInfo.currentWorkTime = Math.floor(tempInfo.currentWorkTime);
  Event2Web.emit("OvertimeWork-changeTime", tempInfo.currentWorkTime);
}

// 核心离线保存数据
function exitSave() {
  saveDataFile(dataFileList[0], {...tempInfo, intervalFlag: null});
  saveDataFile(dataFileList[1], pluginConfig);
}


module.exports = {router, pluginConfig, exitSave};