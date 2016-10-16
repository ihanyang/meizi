const http = require("http")
const fs = require("fs")
const parse = require("url").parse

const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36"

const request = (url) => {
	return new Promise((resolve, reject) => {
		http.request({
			hostname: parse(url).hostname,
			path: parse(url).pathname,
			headers: {
				"User-Agent": ua
			}
		}, (res) => {
			const buffer = []

			res.on("data", (chunk) => {
				buffer.push(chunk)
			})

			res.on("end", () => {
				resolve(Buffer.concat(buffer).toString())
			})

		}).on("error", (error) => {
			reject(error)
		}).end()
	})
}

const requestImage = (url, path) => {
	return new Promise((resolve, reject) => {
		http.request({
			hostname: parse(url).hostname,
			path: parse(url).pathname,
			headers: {
				"User-Agent": ua
			}
		}, (res) => {
			if (res.statusCode === 404) {
				reject(new Error("妹纸不存在"))

				return
			}

			const filename = url.match(/\w+\.\w+$/g)[0]

			res.pipe(fs.createWriteStream(`${path}/${filename}`))

			resolve()
		}).on("error", () => {
			reject(new Error("妹纸跑掉了"))
		}).end()
	})
}

const createDir = (path) => {
	return new Promise((resolve, reject) => {
		fs.stat(path, (error, stats) => {
			if (error && error.code === "ENOENT") {
				fs.mkdir(path, () => {
					resolve()
				})
			} else {
				resolve()
			}
		})
	})
}

module.exports = {
	request,
	requestImage,
	createDir
}