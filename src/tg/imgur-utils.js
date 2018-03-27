const config = require('../config');
const util = require('./util');

const path = require('path');
const os = require('os');

const fs = require('fs-extra');
const imgur = require('imgur');
const webp = require('webp-converter');
const logger = require('winston');

if (config.uploadToImgur) {
    imgur.setClientId(config.imgurClientId);
}

exports.uploadToImgur = function(fileId, config, tg, callback) {
    
    fs.mkdtemp(path.join(os.tmpdir(), 'teleirc-'))
    .then(function(downloadDirPath) {
        
        tg.downloadFile(fileId, downloadDirPath)
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
            return imgur.uploadFile(filePath);
        })
        .then(function(json) {

            fs.remove(downloadDirPath)
            .then(function() {
                callback(json.data.link);
            })
            .catch(function(error) {
                logger.error(error);
            });
        })
        .catch(function(error) {
            logger.error(error);
        });
    })
    .catch(function(error) {
        logger.error(error);
    });
};

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
