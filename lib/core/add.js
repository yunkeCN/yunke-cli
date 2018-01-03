const ora = require('ora');
const chalk = require('chalk');
const execa = require('execa');
const {prompt} = require('inquirer');

const {write, isEmptyDir} = require('../utils/fs');

const templatesDir = `${__dirname}/../../templates`;

const tplList = require('../../templates/tpl');


module.exports = async (repo, branch = 'master') => {
  const tplname = repo.split('/').pop().replace('.git', '');

  const tplDir = `${templatesDir}/${tplname}`;


  if (!await isEmptyDir(tplDir)) { // update
    const question = [
      {
        type: 'confirm',
        name: 'update',
        message: chalk.yellow(`template ${tplname} is already exist,do you want to update now?`),
        default: false
      }
    ];

    const answer = await prompt(question);

    if (!answer.update) return;

    const cmdStr = `cd ${tplDir} && git pull`; // todo

    console.log(chalk.white(`\n start update template ${tplname}...`));

    const spinner = ora('Update template...');

    spinner.start();

    try {
      await execa.shell(cmdStr);

      spinner.stop();

      tplList[tplname] = {url: repo, name: tplname, branch};

      await write(`${templatesDir}/tpl.json`, JSON.stringify(tplList));

      console.log(chalk.green(`\n \u2714 template ${tplname} has been updated successfully!`));
    } catch (err) {
      throw err;
    }
  } else { // clone
    const cmdStr = `git clone ${repo} ${tplDir} && cd ${tplDir} && git checkout ${branch}`;

    console.log(chalk.white(`\n Start add templates ${repo}...`));

    const spinner = ora('Downloading template...');

    spinner.start();

    try {
      await execa.shell(cmdStr);

      spinner.stop();

      tplList[tplname] = {url: repo, name: tplname, branch};

      await write(`${templatesDir}/tpl.json`, JSON.stringify(tplList));

      console.log(chalk.green('\n \u2714 New template has been added successfully!'));
    } catch (err) {
      throw err;
    }
  }
};
