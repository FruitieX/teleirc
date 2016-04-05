/* prints the official telegram group chat URL to console.
 *
 * the point of having this script instead of the URL directly in README
 * is to stop automated spambots from crawling it from github
 */

console.log('Join our official Telegram group:\n');

// generated with new Buffer(theUrl, 'ascii').toString('hex')
var h = '68747470733a2f2f74656c656772616d2e6d652f6a6f696e636' +
        '861742f4151574b4a7a355a483563546f644d746f6d445f3741';
var url = new Buffer(h, 'hex').toString('ascii');

console.log(url);
