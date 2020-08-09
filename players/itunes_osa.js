const events = require("events");
const process = require("child_process");
const fs = require("fs")
const { fstat } = require("fs");
var zwsp = "​"
var args = []
var player = "iTunes"

var OSRelease = parseInt(require("os").release().split(".")[0])
if (OSRelease > 18) {
    player = "Music"
}

var script = `set zwsp to "​"
set text item delimiters to "|" & zwsp & "|"
tell application "${player}"
    repeat while true
        try
            log {id,name,artist,album,duration} of current track & {player position,player state} as text
        on error
            set text item delimiters of AppleScript to "|" & zwsp & "|"
            log "0|​||​||​||​|0|​|0|​|stopped"
        end try
        delay 1
    end repeat
end tell`
for (var line of script.split("\n")) {
    args.push("-e",JSON.stringify(line.trim()))
}


class iTunesOSAPlayer extends events.EventEmitter {
    constructor() {
        super()
    }
    start() {
        this.osaProc = process.exec("/usr/bin/osascript " + args.join(" "))
        this.osaProc.stderr.on("data",(a) => {
            a = a.trim()
            a = a.split("|" + zwsp + "|")
            if (a.length != 7) { return }
            if (a[6] == "playing") {
                this.data = {
                    id: a[0],
                    track: a[1],
                    artist: a[2],
                    album: a[3],
                    duration: parseInt(a[4]),
                    pos: parseInt(a[5]),
                }
                this.emit("update", this.data)
            }
        })
        
    }
    getAlbumArt() {
        var fn = "./artCache/" + (this.data.id || 0) + ".jpg"
        if (fs.existsSync(fn)) {
            return fn
        }
        if (!fs.existsSync("./artCache/")) { fs.mkdirSync("./artCache") }
        var proc = process.execSync(`osascript -e 'tell application "iTunes" to get raw data of artwork 1 of current track'`)        
        var hex = proc.toString().replace("«data tdta","").replace("»","");
        require("fs").writeFileSync(fn,Buffer.from(hex, 'hex'))
        return fn
    }
    stop() {
        this.osaProc.kill()
    }
}
module.exports = iTunesOSAPlayer