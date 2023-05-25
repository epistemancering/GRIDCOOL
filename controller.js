let rooms = []
let newest = 0
let host
let firsts = []
module.exports = {
    "newPlayer": function(request, response) {
        if (rooms[newest]) {
            rooms[newest][0][2] = { "x": 7, "y": 0, "direction": "west" }
            host.send({ "room": newest, "player": 1, "positions": rooms[newest][0] })
            response.send({ "room": newest, "player": 2, "positions": rooms[newest++][0] })
        } else {
            rooms[newest] = [[, { "x": 0, "y": 7, "direction": "east" }]]
            host = response
        }
    },
    "move": function (request, response) {
        let present = rooms[request.query.room].length - 1
        let opponent
        if (request.query.player === "1") {
            opponent = 2
        } else {
            opponent = 1
        }
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
            if (rooms[request.query.room][future][1].x === rooms[request.query.room][future][2].x && rooms[request.query.room][future][1].y === rooms[request.query.room][future][2].y) {
                rooms[request.query.room][future][1].x = rooms[request.query.room][present][1].x
                rooms[request.query.room][future][1].y = rooms[request.query.room][present][1].y
                rooms[request.query.room][future][2].x = rooms[request.query.room][present][2].x
                rooms[request.query.room][future][2].y = rooms[request.query.room][present][2].y
            }
            firsts[request.query.room].send(rooms[request.query.room][future])
            response.send(rooms[request.query.room][future])
        } else {
            firsts[request.query.room] = response
        }
    },
    "listen": function() {
        console.log("on port 3000")
    }
}