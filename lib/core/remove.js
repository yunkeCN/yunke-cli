const {prompt} = require('inquirer');
const chalk = require('chalk');

const {write, remove} = require('../utils/fs');

const tplList = require('../../templates/tpl');

const tplNames = Object.keys(tplList);

module.exports = async (tplName) => {
  if (tplNames.length < 1) {
    console.log(chalk.red('\n  no template!'));
    return;
  }

  const question = [
    {
      type: 'list',
      name: 'template',
      message: 'Which template you want to delete:',
      choices: Object.keys(tplList),
      when: !tplName
    }
  ];

  const answer = await prompt(question);

  if (answer.template) {
    tplName = answer.template;
  }

  if (tplList[tplName]) {
    delete tplList[tplName];

    await remove(`${__dirname}/../../templates/${tplName}`);

    console.log(chalk.white(`template ${tplName} has been removed`));

    await write(`${__dirname}/../../templates/tpl.json`, JSON.stringify(tplList));

    console.log(chalk.green('\n \u2714 Template has been deleted successfully!'));
  } else {
    console.log(chalk.green('Template does not exist!'));
  }
};

