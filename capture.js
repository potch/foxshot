const webdriver = require('selenium-webdriver');
require('geckodriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const urllib = require('url');

exports.capture = async function capture({ channel, dimensions, url, prefix }) {

  let binary;
  switch (channel) {
    case 'nightly':
      binary = new firefox.Binary(firefox.Channel.NIGHTLY);
      break;
    case 'beta':
      binary = new firefox.Binary(firefox.Channel.BETA);
      break;
    default:
      binary = new firefox.Binary(firefox.Channel.RELEASE);
  }

  binary.addArguments('-headless');

  let options = new firefox.Options();
  options.setBinary(binary);

  let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

  if (!prefix) {
    prefix = urllib.parse(url).hostname;
  }

  try {
    await runTest({ driver, url, dimensions, prefix });
  } catch (e) {
    console.error('Error during capture:', e);
  } finally {
    driver.quit();
  }
};



async function runTest({ driver, url, dimensions, prefix }) {
  let {innerSize, outerSize} = await driver.executeScript(`
    return {
      outerSize: {
        width: window.outerWidth,
        height: window.outerHeight
      },
      innerSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
  `);

  let chromeSize = {
    width: outerSize.width - innerSize.width,
    height: outerSize.height - innerSize.height
  };

  console.log('loading site...');
  await driver.get(url);
  await driver.sleep(1000);

  for (let [width, height] of dimensions) {
    let string = width + 'x' + height;
    console.log(string);
    await driver.manage().window().setSize(width + chromeSize.width, height + chromeSize.height);
    await driver.sleep(1000);
    let data = await driver.takeScreenshot();
    let b = Buffer.from(data, 'base64');
    fs.writeFileSync(`./${prefix}_${string}.png`, b);
  }

  return true;
}
