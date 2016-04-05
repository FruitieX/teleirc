/* prints the official telegram group chat URL to console.
 *
 * the point of having this script instead of the URL directly in README
 * is to stop automated spambots from crawling it from github
 */

console.log('Join our official Telegram group:\n');

// generated with new Buffer(theUrl, 'ascii').toString('hex')
var h = '4151574b4a776649486f5a354676535675362d515951';
var url = 'https://telegram.me/joinchat/';
url += new Buffer(h, 'hex').toString('ascii');

console.log(url);
