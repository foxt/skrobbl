const cfg = require("./config")
const LFM = require("./LastFM")
const lfm = new LFM(cfg.application)

function open(url) {
    require("child_process").spawnSync("/usr/bin/open",[url])
}
function wait() {
    return new Promise(function(a,r) {
        process.stdin.once("data",a)
    })
}

async function auth() {
    var tkn = await lfm.makeGET("auth.gettoken") 
    console.log("Got token",tkn)
    open(`https://www.last.fm/api/auth?api_key=${cfg.application.key}&token=${tkn.token}`)
    console.log("Press enter after you have authorized the app")
    await wait()
    var sk = await lfm.makePOST("auth.getsession",{token:tkn.token}) 
    console.log(sk)
}

async function setnp() {
    console.log(await lfm.makePOST("track.scrobble", {
        artist: "Muzzy",
        track: "Calling Out",
        timestamp: Math.floor(new Date().getTime() / 1000),
        album: "Monstercat 025 - Threshold",
        chosenByUser: 1,
        duration: 335,

    }))
}

setnp()