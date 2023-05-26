let rooms = []
let host
let newest = 0
let firsts = []
module.exports = {
    "start": function(request, response) {
        if (firsts[request.query.room]) {
            rooms[request.query.room] = [
                { "x": 0, "y": 0, "axis": "x", "direction": 1 },
                { "x": 7, "y": 7, "axis": "x", "direction": -1 }
            ]
            firsts[request.query.room].send({ "room": request.query.room, "player": 1, "positions": rooms[request.query.room] })
            response.send({ "room": request.query.room, "player": 0, "positions": rooms[request.query.room] })
        } else if (host) {
            let room = newest++
            host.send({ "room": room })
            firsts[room] = response
            host = undefined
            setTimeout(function() {
                if (!rooms[room]) {
                    delete firsts[room]
                    response.send()
                }
            }, 1000)
        } else {
            host = response
        }
    },
    "move": function (request, response) {
        let direction = Number(request.query.direction)
        if ((request.query.axis === "x" || request.query.axis === "y") && (direction === -1 || direction === 0 || direction === 1)) {
            delete rooms[request.query.room][request.query.player].bonk
            rooms[request.query.room][request.query.player].move = { "axis": request.query.axis, "direction": direction }
            if (rooms[request.query.room][Number(!Number(request.query.player))].move) {
                let trajectories = [{}, {}]
                for (let index in trajectories) {
                    trajectories[index].x = rooms[request.query.room][index].x
                    trajectories[index].y = rooms[request.query.room][index].y
                    if (rooms[request.query.room][index].move.axis === rooms[request.query.room][index].axis && rooms[request.query.room][index].move.direction === rooms[request.query.room][index].direction) {
                        let trajectory = trajectories[index][rooms[request.query.room][index].axis] + rooms[request.query.room][index].direction
                        if (trajectory === -1 || trajectory === 8) {
                            rooms[request.query.room][index].bonk = true
                        } else {
                            trajectories[index][rooms[request.query.room][index].axis] = trajectory
                        }
                    }
                }
                if (trajectories[0].x === trajectories[1].x && trajectories[0].y === trajectories[1].y) {
                    rooms[request.query.room][0].bonk = rooms[request.query.room][1].bonk = true
                } else {
                    for (let index in trajectories) {
                        if (rooms[request.query.room][index].move.direction) {
                            rooms[request.query.room][index].x = trajectories[index].x
                            rooms[request.query.room][index].y = trajectories[index].y
                            rooms[request.query.room][index].axis = rooms[request.query.room][index].move.axis
                            rooms[request.query.room][index].direction = rooms[request.query.room][index].move.direction
                        }
                    }
                }
                delete rooms[request.query.room][0].move
                delete rooms[request.query.room][1].move
                for (let index1 in trajectories[0]) {
                    if (rooms[request.query.room][0][index1] === rooms[request.query.room][1][index1]) {
                        if (index1 === "x") {
                            index1 = "y"
                        } else {
                            index1 = "x"
                        }
                        let order
                        if (rooms[request.query.room][0][index1] < rooms[request.query.room][1][index1]) {
                            order = -1
                        } else {
                            order = 1
                        }
                        for (let index2 in trajectories) {
                            if ((order *= -1) * rooms[request.query.room][index2].direction === 1 && rooms[request.query.room][index2].axis === index1) {
                                rooms[request.query.room][index2].fire = true
                            }
                        }
                    }
                }
                firsts[request.query.room].send(rooms[request.query.room])
                response.send(rooms[request.query.room])
            } else {
                firsts[request.query.room] = response
            }
        } else {
            response.sendStatus(400)
        }
    },
    "listen": function() {
        console.log("on port 3000")
    }
}