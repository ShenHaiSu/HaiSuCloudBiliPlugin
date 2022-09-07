const fs = require("fs");
const fsP = require("fs/promises");

function infoLog(input) {
  if (typeof input !== "string") input = JSON.stringify(input);
  input = "[ 消息 ] " + input;
  console.log(input);
  log2file(input);
}

function errLog(input) {
  if (typeof input !== "string") input = JSON.stringify(input);
  input = "[ 错误 ] " + input;
  console.log(input);
  log2file(input);
}
function liveMessageLog(input) {
  if (typeof input !== "string") input = JSON.stringify(input);
  console.log(input);
  log2file(input,"liveMessageLog");
}

function log2file(content,dirName = "log") {
  // 判断内容类型
  if (typeof content !== "string") return false;

  // 追加log内容
  content = "\n" +  new Date().toLocaleTimeString() + " " + content;

  // 获取文件路径
  let fileName = new Date().toLocaleDateString().replaceAll("/", "-") + ".log";
  let fileDir = __dirname.split("\\");
  fileDir.pop();
  fileDir = fileDir.concat([dirName,fileName]).join("\\");

  // 将日志写入文件
  try {
    fs.appendFileSync(fileDir, content);
  } catch (err) {
    console.log(err);
    console.log("[ 错误 ] 错误报告了嗷。");
  }
}

module.exports = {infoLog,errLog,liveMessageLog};