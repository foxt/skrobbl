// the last.fm api is absolute balls
// i hate it 

const fetch = require("node-fetch")
const crypto = require("crypto")
const { writeHeapSnapshot } = require("v8")

class LastFM {
    constructor(conf) {
        this.root = "https://ws.audioscrobbler.com/2.0/",
        this.ua = "Skrobbl/1.0"
        for (var i in conf) {this[i] = conf[i]}
    }
    async makeGET(method,params) {
        params = params || {}
        var url = this.root + "?method=" + encodeURIComponent(method)
        params["api_key"] = params["api_key"] || this.key
        params["format"] = "json"
        for (var p in params) {
            url += "&" + encodeURIComponent(p) + "=" + encodeURIComponent(params[p])
        }
        var headers = {
            "User-Agent": this.ua
        }
        var ftch = await fetch(url,{headers})
        console.log("GET request to",method,(ftch.ok ? "succeeded" : "failed"),"with code",ftch.status)
        return (ftch).json()
    }
    async makePOST(method,params) {
        params = params || {}
        var body = "method=" + encodeURIComponent(method)
        params["api_key"] = params["api_key"] || this.key
        params["format"] = "json"
        params["sk"] =  this.sk
        for (var p of Object.keys(params).sort()) {
            body += "&" + encodeURIComponent(p) + "=" + encodeURIComponent(params[p])
        }
        params["method"] = method
        var sig = ""
        for (var key of Object.keys(params).sort()) {
            if (key == "format") continue;
            sig += key + params[key]
        }
        sig += this.secret 
        body += "&api_sig=" + crypto.createHash("md5").update(sig,"utf8").digest("hex")

        var headers = {
            "User-Agent": this.ua
        }
        var ftch = await fetch(this.root,{headers,method:"POST",body})
        console.log("POST request to",method,(ftch.ok ? "succeeded" : "failed"),"with code",ftch.status)
        return (ftch).json()
    }

}
module.exports = LastFM