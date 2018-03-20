var config = require('../config');
var util = require('./util');
var imgur = require('imgur');
var webp = require('webp-converter');
var logger = require('winston');
var path = require('path');
var os = require('os');
var mkdirp = require('mkdirp');

if (config.uploadToImgur) {
    imgur.setClientId(config.imgurClientId);
}

exports.uploadToImgur = function(fileId, config, tg, callback) {
    var filesPath = os.tmpdir();
    var randomString = util.randomValueBase64(config.mediaRandomLength);
    mkdirp(path.join(filesPath, randomString));
    tg.downloadFile(fileId, path.join(filesPath, randomString))
    .then(function(filePath) {
        
        /* Imgur doesn't allow webp, so convert them to png. */
        if (path.extname(filePath) === '.webp') {
            var convertedFilePath = filePath + '.png';
            webp.dwebp(filePath, convertedFilePath, '-o', function(status) {
                if (status.startsWith('100')) { // success
                    imgur.uploadFile(convertedFilePath)
                    .then(function(json) {
                        callback(json.data.link);
                    })
                    .catch(function(error) {
                        logger.error(error.message)
                    });
                } else { // error
                    logger.error('webp to png conversion failed');
                }
            });
        } else {
            imgur.uploadFile(filePath)
            .then(function(json) {
                callback(json.data.link);
            })
            .catch(function(error) {
                logger.error(error.message)
            });
        }
    })
    .catch(function(error) {
        logger.error(error.message)
    });
};
