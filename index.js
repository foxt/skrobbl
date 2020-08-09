const cfg = require("./config")
const LFM = require("./LastFM")
const lfm = new LFM(cfg.application)
const notify = cfg.notifications.onNewTrack || cfg.notifications.onScrobble ? require('node-notifier') : undefined;
const { player } = require("./config");

var scrobbleThreshold = 0.5

;(async function() {
    if (!cfg.application.sk) {
        console.log("Authenticating with Last.fm, open the following link in a browser:")
        var tkn = await lfm.makeGET("auth.gettoken") 
        console.log(`https://www.last.fm/api/auth?api_key=${cfg.application.key}&token=${tkn.token}`)
        console.log("Press enter after you have authorized the app")
        await new Promise(function(a,r) {
            process.stdin.once("data",a)
        })
        var sk = await lfm.makePOST("auth.getsession",{token:tkn.token})
        sk = sk.session.key
        console.log("Please place this in your application object in your config, and restart.")
        console.log("sk: " + JSON.stringify(sk))
        process.exit()
    }
    cfg.player.start()
    var lastTrack
    var scrobbled = false
    var timeStarted = {}
    cfg.player.on("update",(song) => {
        if (scrobbled && lastTrack == song.id) { return };
        if (lastTrack != song.id) {
            console.log("New song",song.track)
            lastTrack = song.id
            scrobbled = false
            timeStarted[song.id] = Math.floor(new Date().getTime() / 1000)
            lfm.makePOST("track.updateNowPlaying", song).then(console.log).catch(console.error)
            if (cfg.notifications.onNewTrack)  {
                notify.notify({
                    title: song.track,
                    message: "by " + song.artist,
                    icon:  player.getAlbumArt()
                })
            }
        }
        if (lastTrack == song.id && !scrobbled && (song.pos / song.duration) > scrobbleThreshold) {
            console.log("Scrobbling",song.track)
            scrobbled = true
            console.log(song)
            song.chosenByUser = 1
            song.timestamp = timeStarted[song.id] || Math.floor(new Date().getTime() / 1000) - song.pos
            lfm.makePOST("track.scrobble", song).then((a) => {
                console.log(a)
                if (cfg.notifications.onScrobble && a["scrobbles"]["@attr"]["accepted"] > 0)  {
                    notify.notify({
                        title: a.scrobbles.scrobble.track["#text"],
                        message: "Scrobbled",
                        icon:  player.getAlbumArt()
                    })
                }
                
            }).catch(console.error)
            
        }
    })
})()