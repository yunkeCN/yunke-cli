const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const {prompt} = require('inquirer');

const fs = require('../utils/fs');

const templatesDir = `${__dirname}/../../templates`;

const tplList = require('../../templates/tpl');

const tplNames = Object.keys(tplList);

const ignore = ['.DS_Store', '.svn', '.git', '.bin'];

module.exports = async (tplName, dest) => {
  let destDir = process.cwd();
  let srcDir;

  if (tplName) {
    srcDir = `${templatesDir}/${tplName}`;
  } else {
    const question = [
      {
        type: 'list',
        name: 'template',
        message: 'Which template you want to delete:',
        choices: tplNames,
        when: tplNames.length > 0
      }
    ];

    const answer = await prompt(question);

    if (answer.template) {
      srcDir = `${templatesDir}/${answer.template}`;
    } else {
      console.log(chalk.red('no template!'));
      return;
    }
  }

  if (dest) {
    destDir = path.join.apply(null, [process.cwd()].concat(dest));
  }

  const tplExist = await fs.exist(srcDir);
  const destDirExist = await fs.exist(destDir);

  if (!destDirExist) {
    await fs.mkdirp(path.join(destDir, 'xx'));
    console.log(chalk.white('create project dir successfully!'));
  }

  // Check if the destination is empty
  if (!await fs.isEmptyDir(destDir)) {
    const question = [
      {
        type: 'confirm',
        name: 'cover',
        message: chalk.yellow(`${destDir} is not empty,sure you want to cover it?`),
        default: false
      }
    ];
    const answer = await prompt(question);
    if (!answer.cover) return;
  }

  if (tplExist) {
    const spinner = ora('Init project...');
    spinner.start();
    await fs.copy({
      from: srcDir,
      to: destDir,
      ignore,
      quiet: true
    });
    spinner.stop();
    console.log(chalk.green('New project has been initialized successfully!'));
  }
};
