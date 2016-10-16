#!/usr/bin/env node
const program = require("commander")
const Progress = require("progress")

const {request, requestImage, createDir} = require("./utils")

const root = process.cwd()
const targetURLs = []

let targetURL = "http://www.mzitu.com"

let urls = [] // 不同类型妹子的 URL
let titles = [] // 不同类型妹子的名字
let title = ""

let overtimes = []
let errors = []

let offset = -1
let pageIndex = -1
let startTime = ""

const getMeiziInfo = (url) => {
	overtimes = []
	errors = []

	return new Promise((resolve, reject) => {
		console.log()
		console.log("\033[91m 正在分析页面。。。")

		request(url).then((html) => {
			const areaHTML = html.match(/<(ul)\sid="pins(.|\n)+<\/ul>/)[0]

			titles = areaHTML.match(/>([\u4e00-\u9fff]|\w)+[^<']+<\/a/g) // 文件夹名
			urls = [... new Set(areaHTML.match(/http[^\sb]+\d+/g))] // 目标 URL 数组

			titles = titles.map((title) => {
				return title.replace("</a", "").replace(">", "")
			})

			urls = urls.slice(0, 1)
			titles = titles.slice(0, 1)

			console.log()
			console.log(` 分析完成~~ 共有${urls.length}种类型的妹纸等待捕获~~`)
			console.log()

			resolve()
		})
	})
}

const startCapture = () => {
	const url = urls.shift()

	title = titles.shift()

	console.log()
	console.log(`\u001b[32m 开始捕获 ${title}`)

	const path = `${root}/images/${title}`

	Promise.all([createDir(path), analyseMeizi(url)]).then(([, {meiziImageURL}]) => {
		getMeizi(meiziImageURL, path)
	})
}

const analyseMeizi = (url) => {
	return new Promise((resolve, reject) => {
		request(url).then((html) => {
			let total = + html.match(/page(.|\r|\n)+raqu/)[0].match(/<span>\d+<\/span>/g).pop().replace(/[^\d]/g, "")

			const title = html.match(/<title>(.+)<\/title>/)[1].split("-")[0].trim()
			const imgTag = html.match(/<(?=img)[^>]+>/g)[0]
			const imgURL = imgTag.match(/http[^'\s]+\.(jpg|jpeg|png)/g)[0].replace(/("|')/g, "")
			const firstPrefix = imgURL.split("01.")[0]
			const lastPrefix = imgURL.split("01.")[1]

			const meiziImageURL = [] // 妹子图片的地址

			console.log()
			console.log(` 共 ${total} 只妹纸~~`)
			console.log()

			while (total) {
				meiziImageURL.unshift(`${firstPrefix}${total < 10 ? "0" + total : total}.${lastPrefix}`)

				total--
			}

			resolve({
				title,
				meiziImageURL
			})
		})
	})
}

const getMeizi = (meiziImageURL, path) => {
	const total = meiziImageURL.length
	const bar = new Progress(" :bar :percent", {
		total: total,
		width: 50
	})

	const complete = (bar) => {
		bar.tick()

		if (bar.complete) {
			if (urls.length) {
				startCapture()
			} else {
				const endTime = Date.now()

				if (offset !== -1) {
					console.log()
					console.log()
					console.log(`\u001b[36m *********************第${program.pageIndex - pageIndex}页抓取结束*********************`)
					console.log()
				}

				if (offset === 0 || offset === -1) {
					console.log()
					console.log(`\u001b[36m 本次抓取结束共耗时 ${(endTime - startTime) / 1000}s`)

					return
				}

				if (errors.length) {
					console.log()
					console.log(` ${errors.length}个妹纸意外失踪`)
					console.log()

					errors.forEach((item) => {
						console.log(` 妹纸：${item.title}\n 文件名：${item.url.split("/").pop()}\n`)
					})
				}

				if (overtimes.length) {
					console.log()
					console.log(` ${overtimes.length}个妹纸超时跑掉`)

					overtimes.forEach((item) => {
						console.log(` 妹纸：${item.title}\n 文件名：${item.url.split("/").pop()}\n`)
					})
				}

				if (offset-- > 0) {
					targetURL = `http://www.mzitu.com/page/${++program.pageIndex}`

					getMeiziInfo(targetURL).then(() => {
						startCapture()
					})
				}
			}
		}
	}

	while (meiziImageURL.length) {
		const url = meiziImageURL.shift()

		requestImage(url, path).then(() => {
			complete(bar)
		}).catch((error) => {
			if (error.message === "妹纸不存在") {
				errors.push({
					title,
					url
				})
			}

			if (error.message === "妹纸跑掉了") {
				overtimes.push({
					title,
					url
				})
			}

			complete(bar)
		})
	}
}

const singleMeizi = (id) => {
	const url = `http://www.mzitu.com/${id}`

	console.log()
	console.log("\033[91m 正在分析页面。。。")

	startTime = Date.now()

	Promise.all([createDir(`${root}/images`), analyseMeizi(url)]).then(([, {title, meiziImageURL}]) => {
		const path = `${root}/images/${title}`

		console.log(`\u001b[32m 开始捕获 ${title}`)
		console.log()

		createDir(path).then(() => {
			getMeizi(meiziImageURL, path)
		})
	})
}

startTime = Date.now()

program
	.version("1.0.0")
	.option("-i --id <id>", "需要抓取的ID")
	.option("-p --pageIndex <pageIndex>", "需要抓取的页面索引")
	.option("-f --offset <offset>", "需要抓取的页面偏移量")
	.parse(process.argv)

if (program.id) {
	singleMeizi(program.id)

	return
}

if (program.pageIndex) {
	if (program.offset !== undefined) {
		if (program.offset < 0) {
			console.log("\n \033[91m argument no valid")

			return
		}

		offset = program.offset
		pageIndex = program.pageIndex - 1
		targetURL = `http://www.mzitu.com/page/${program.pageIndex}`



		Promise.all([createDir(`${root}/images`), getMeiziInfo(targetURL)]).then(() => {
			startCapture()
		})

		return
	}

	targetURL = `http://www.mzitu.com/page/${program.pageIndex}`

	Promise.all([createDir(`${root}/images`), getMeiziInfo(targetURL)]).then(() => {
		startCapture()
	})

	return
}

Promise.all([createDir(`${root}/images`), getMeiziInfo(targetURL)]).then(() => {
	startCapture()
})