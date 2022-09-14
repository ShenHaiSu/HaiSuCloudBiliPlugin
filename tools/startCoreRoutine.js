const fsP = require("fs/promises");
const fs = require("fs");
const LOG = require("../tools/logFuncs");

function startCoreRoutine() {
  deleteTempFiles();
}

// 删除临时缓存文件
function deleteTempFiles() {
  // 缓存文件目录
  let tempDir = "./data/TempFiles"
  fsP.readdir(tempDir)
    .catch(() => Promise.reject("路径不存在"))
    .then(files => {
      for (let index in files)
        fs.rmSync(tempDir + "/" + files[index]);
    })
    .catch(() => fsP.mkdir(tempDir))
    .then(() => {
      LOG.infoLog("已删除当前已有的缓存文件");
    })
}

module.exports = {startCoreRoutine};