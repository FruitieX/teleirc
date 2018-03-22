const config = require('../config');
const util = require('./util');

const path = require('path');
const os = require('os');

const imgur = require('imgur');
const webp = require('webp-converter');
const logger = require('winston');
const mkdirp = require('mkdirp');

if (config.uploadToImgur) {
    imgur.setClientId(config.imgurClientId);
}

exports.uploadToImgur = function(fileId, config, tg, callback) {
    let filesPath = os.tmpdir();
    let randomString = util.randomValueBase64(config.mediaRandomLength);
    let downloadDir = path.join(filesPath, randomString);
    
    createDir(downloadDir)
    .then(function() {
        return tg.downloadFile(fileId, downloadDir);
    })
    .then(function(filePath) {
        
        /* Imgur doesn't allow webp, so convert them to png. */
        if (path.extname(filePath) === '.webp') {
            let convertedFilePath = filePath + '.png';
            return convertWebpToPng(filePath, convertedFilePath);
        } else {
            return Promise.resolve(filePath);
        }
    })
    .then(function(filePath) {
        return imgur.uploadFile(filePath)
    })
    .then(function(json) {
        callback(json.data.link);
    })
    .catch(function(error) {
        logger.error(error);
    });
};

function createDir(dir) {
    return new Promise(function(resolve, reject) {
        mkdirp(dir, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function convertWebpToPng(sourceFile, targetFile) {
    return new Promise(function(resolve, reject) {
        webp.dwebp(sourceFile, targetFile, '-o', function(status) {
            if (status.startsWith('100')) {
                resolve(targetFile);
            } else {
                reject(new Error('webp to png conversion failed'));
            }
        });
    });
}
