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
const linkCache = new LRU(config.imgurLinkCacheSize, linkCacheData);

if (config.uploadToImgur) {
    imgur.setClientId(config.imgurClientId);
}

exports.uploadToImgur = function(fileId, config, tg, callback) {

    /* Kind of a hack to get an async function to complete with a callback. */
    async function impl() {

        try {
            const downloadDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'teleirc-'));

            const filePath = await tg.downloadFile(fileId, downloadDirPath);

            const fileContentBuffer = await fs.readFile(filePath);
            const md5Hash = md5(fileContentBuffer);

            if (!linkCache.has(md5Hash)) {

                /* Imgur doesn't allow webp, so convert them to png. */
                let uploadableFilePath = filePath;
                if (path.extname(filePath) === '.webp') {
                    const convertedFilePath = filePath + '.png';
                    uploadableFilePath = await convertWebpToPng(filePath, convertedFilePath);
                }

                const imgurData = await imgur.uploadFile(uploadableFilePath);

                linkCache.set(md5Hash, imgurData.data.link);

                /* Not waiting for this write, because it doesn't matter when it
                * finishes. */
                fs.writeJson(linkCacheFilePath, [...linkCache]);
            }
            const imgurLink = linkCache.get(md5Hash);

            /* Cleanup. Not waiting for this. */
            fs.remove(downloadDirPath);

            return imgurLink;

        } catch (error) {
            logger.error(error);
        }

    }
    impl().then((imgurLink) => callback(imgurLink));
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
