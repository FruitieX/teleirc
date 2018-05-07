const config = require('../config');
const util = require('./util');
const argv = require('../arguments').argv;

const path = require('path');
const os = require('os');

const fs = require('fs-extra');
const imgur = require('imgur');
const webp = require('webp-converter');
const logger = require('winston');
const LRU = require('modern-lru');
const md5 = require('md5');

const configDir = path.dirname(argv.c || path.join(os.homedir(), '.teleirc', 'config.js'));
const linkCacheFilePath = path.join(configDir, 'imgurLinkCache.json');

let linkCacheData = [];
try {
    if (fs.pathExistsSync(linkCacheFilePath)) {
        linkCacheData = fs.readJsonSync(linkCacheFilePath);
    }
} catch (error) {
    logger.error(error);
}
const linkCache = new LRU(1000, linkCacheData);

if (config.uploadToImgur) {
    imgur.setClientId(config.imgurClientId);
}

exports.uploadToImgur = function(fileId, config, tg, callback) {
    
    fs.mkdtemp(path.join(os.tmpdir(), 'teleirc-'))
    .then(function(downloadDirPath) {
        
        tg.downloadFile(fileId, downloadDirPath)
        .then(function(filePath) {
            
            return fs.readFile(filePath)
            .then(function(fileContentBuffer) {
                const md5Hash = md5(fileContentBuffer);
                const imgurLink = linkCache.get(md5Hash);
                if (imgurLink === undefined) {
                
                    /* Imgur doesn't allow webp, so convert them to png. */
                    let conversionPromise;
                    if (path.extname(filePath) === '.webp') {
                        const convertedFilePath = filePath + '.png';
                        conversionPromise = convertWebpToPng(filePath, convertedFilePath);
                    } else {
                        conversionPromise = Promise.resolve(filePath);
                    }

                    return conversionPromise
                    .then(function(newFilePath) {
                        return imgur.uploadFile(newFilePath);
                    })
                    .then(function(json) {
                        const link = json.data.link;
                        linkCache.set(md5Hash, link);
                        fs.writeJson(linkCacheFilePath, [...linkCache])
                        .catch(function(error) {
                            logger.error(error);
                        });
                        return link;
                    });
                } else {
                    return Promise.resolve(imgurLink);
                }
            });
        })
        .then(function(link) {

            fs.remove(downloadDirPath)
            .then(function() {
                callback(link);
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
