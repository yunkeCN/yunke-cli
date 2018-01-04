
## 主要功能 

快速创建项目，初始化项目结构及配置
目前没有发布npm包，本地开发clone后npm link


## 可用命令

```bash
# 添加模版
$ yunke add template-repertory 

# 查看本地模版
$ yunke list 

# 初始化项目
$ yunke init template-name

# 删除本地模版
$ yunke remove template-name

```


## 快速开始

```bash
# 全局安装
$ npm i -g yunke-cli

# 安装模版
$ yunke add git@github.com:fbi-templates/fbi-project-vue.git

# 切换到工作目录
$ cd path/to/workspace

# 初始化项目示例
$ yunke init fbi-project-vue my-project

# 切换到项目目录
$ cd my-project

```

## Todo
- 发布npm包？
- 初始化项目init直接使用远程仓库 
  yunke init https://github.com/fbi-templates/fbi-project-vue.git
- 已建git仓库，本地初始化时同时写入git配置
 git init
 git remote add origin git@gitlab.com:aaaa/aaaa.git
 git add .
 git commit
 git push -u origin master
