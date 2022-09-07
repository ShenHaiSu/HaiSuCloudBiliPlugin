const fs = require("fs");
const fsP = require("fs/promises");
const LOG = require("./logFuncs");

/**
 * 获取数据包的头二进制数据
 * @param body {Object|String} 内容
 * @param index {Number} 包索引
 * @param Opcode {Number} 操作码
 */
function getHeader(body, index = 1, Opcode = 7) {
  // 0000 0101 0010 0001 0000 0007 0000 0001  认证包的头部数据案例
  //   总长度   头部长 协议    操作      索引
  // 0000 001d 0010 0001 0000 0001 0000 0000
  // 0000 001a 0010 0001 0000 0008 0000 0001

  // 初始化
  let output = Buffer.alloc(16);
  // 修改总长度
  let length = (typeof body === "string") ? body.length + 16 : (JSON.stringify(body).length + 16);
  output.writeUint16BE(length, 2);
  // 修改头部
  output.writeInt8(16, 5);
  // 修改协议
  output.writeInt8(1, 7);
  // 修改操作码
  // output.writeInt8((index === 1) ? 7 : 1, 11);
  output.writeInt8(Opcode, 11);
  // 修改包索引
  output.writeUint16BE(index, 14);
  // 输出
  return output;
}

/**
 * 将内存中的config保存到静态文件
 * @param config {String} 需要保存的config
 * @return {Boolean} 文件保存状态
 */
function saveAppConfig(config) {
  // 转换类型
  if (typeof config !== "string") config = JSON.stringify(config);
  let configDir = __dirname.split("\\");
  configDir.pop();
  configDir.push("config.json");
  configDir = configDir.join("\\");
  try {
    fs.writeFileSync(configDir, config, "utf-8");
    return true;
  } catch (err) {
    LOG.errLog(err.message);
    return false;
  }
}

/**
 * 获取WebSocket可用地址
 * @param hostList {Array<{host:String,port:Number,wss_port:Number,ws_port:Number}>} 主机列表
 * @return {string} 可用的WebSocket地址
 */
function getWSAddress(hostList) {
  let usableList = hostList.filter(item => item.wss_port === 2245);
  if (usableList.length > 0) return `wss://${usableList[0].host}:${usableList[0].wss_port}/sub`;
  return "wss://broadcastlv.chat.bilibili.com:2245/sub";
}

/**
 * 保存data配置文件
 * @param fileName {String} 文件名
 * @param content {String|Object} 文件内容
 */
function saveDataFile(fileName, content) {
  let fileDir = __dirname.split("\\");
  fileDir.pop();
  fileDir = fileDir.concat(["data", fileName]).join("\\");
  fs.writeFileSync(fileDir, (typeof content !== "string") ? JSON.stringify(content) : content);
}

/**
 * 获取data配置文件，如果不存在将会使用默认配置
 * @param fileName {String} 文件名
 * @param defaultContent {String | Object} 默认配置
 * @return {Object}
 */
function getDataFile(fileName, defaultContent = "{}") {
  if (typeof defaultContent !== "string") defaultContent = JSON.stringify(defaultContent);
  let fileDir = __dirname.split("\\");
  fileDir.pop();
  fileDir = fileDir.concat(["data", fileName]).join("\\");
  try {
    fs.accessSync(fileDir);
    return JSON.parse(fs.readFileSync(fileDir, "utf-8"));
  } catch (err) {
    LOG.errLog("访问的缓存文件不存在或者存在语法异常，使用内置默认缓存文件。");
    fs.writeFileSync(fileDir, defaultContent);
    return JSON.parse(defaultContent);
  }
}


module.exports = {getHeader, getWSAddress, saveDataFile, getDataFile};