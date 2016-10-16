# meizi

Node.js 图片爬虫

![meizi.gif](https://github.com/ihanyang/meizi/blob/master/meizi.gif?raw=true)

## Required
- Node.js 6.x

## Installation

``` bash
$ npm install meizi -g
```

## Usage

``` bash
  Usage: meizi [options]

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -i, --id                  自定义抓取的页面ID
    -p, --pageIndex           自定义抓取的起始页。 默认值第一页
    -f, --offset              自定义抓取的页面数量
```

### Examples

```bash
# 默认
$ meizi

# 抓取页面ID为 73288 的妹纸
$ meizi -i 73288

# 抓取第3页的妹纸
$ meizi -p 3

# 抓取第5页的妹纸到第10页
$ meizi -p 5 -f 5