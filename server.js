let express = require("express")
let api = express()
api.use(express.json())
api.use(express.static(__dirname + "/public"))
let rooms = []
let newest = 0
api.get("/start", function(request, response) {
    if (rooms[newest]) {
        rooms[newest][0][2] = { "x": 7, "y": 0, "direction": "west" }
        response.send({ "room": newest, "positions": rooms[newest++][0] })
    } else {
        rooms[newest] = [[, { "x": 0, "y": 7, "direction": "east" }]]
        response.send({ "room": newest })
    }
})
api.get("/start/:room", function(request, response) {
    if (rooms[request.params.room][0][2]) {
        response.send(rooms[request.params.room][0])
    } else {
        response.send()
    }
})
api.put("/move", function(request, response) {
    let present = rooms[request.query.room].length - 1
    let opponent
    if (request.query.player === "1") {
        opponent = 2
    } else {
        opponent = 1
    }
    if (request.query.move) {
        rooms[request.query.room][present][request.query.player].move = request.query.move
        if (rooms[request.query.room][present][opponent].move) {
            let future = rooms[request.query.room].length
            rooms[request.query.room].push([, {}, {}])
            for (let index in rooms[request.query.room][future]) {
                if (rooms[request.query.room][present][index].direction === rooms[request.query.room][present][index].move) {
                    if (rooms[request.query.room][present][index].direction === "north") {
                        rooms[request.query.room][future][index].x = rooms[request.query.room][present][index].x
                        rooms[request.query.room][future][index].y = rooms[request.query.room][present][index].y - 1
                    } else if (rooms[request.query.room][present][index].direction === "east") {
                        rooms[request.query.room][future][index].x = rooms[request.query.room][present][index].x + 1
                        rooms[request.query.room][future][index].y = rooms[request.query.room][present][index].y
                    } else if (rooms[request.query.room][present][index].direction === "south") {
                        rooms[request.query.room][future][index].x = rooms[request.query.room][present][index].x
                        rooms[request.query.room][future][index].y = rooms[request.query.room][present][index].y + 1
                    } else {
                        rooms[request.query.room][future][index].x = rooms[request.query.room][present][index].x - 1
                        rooms[request.query.room][future][index].y = rooms[request.query.room][present][index].y
                    }
                } else {
                    rooms[request.query.room][future][index].x = rooms[request.query.room][present][index].x
                    rooms[request.query.room][future][index].y = rooms[request.query.room][present][index].y
                }
                rooms[request.query.room][future][index].direction = rooms[request.query.room][present][index].move
            }
            response.send(rooms[request.query.room][future])
        } else {
            response.send()
        }
    } else {
        if (!rooms[request.query.room][present][request.query.player].move) {
            --present
        }
        if (rooms[request.query.room][present][opponent].move) {
            response.send(rooms[request.query.room][present + 1])
        } else {
            response.send()
        }
    }
})
api.listen(3000, function() {
    console.log("on port 3000")
})