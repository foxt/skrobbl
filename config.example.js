module.exports ={
    application: {
        key: "",
        secret: "",
    },
    notifications: {
        onNewTrack: false,
        onScrobble: true,
    },
    player: new (require("./players/itunes_osa"))()
}