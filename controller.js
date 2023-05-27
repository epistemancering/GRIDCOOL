let rooms = []
let newest = 0
let channels = []
let channel
let name
let hue
module.exports = {
    "start": function(request, response) {
        if (channels[request.query.room]) {
            rooms[request.query.room].positions = {}
            let names = Object.keys(rooms[request.query.room].hues)
            let left = Math.floor(2 * Math.random())
            rooms[request.query.room].positions[names[left]] = { "x": 0, "y": 0, "axis": "x", "direction": 1 }
            rooms[request.query.room].positions[names[Number(!left)]] = { "x": 7, "y": 7, "axis": "x", "direction": -1 }
            channels[request.query.room].send({ "room": request.query.room, "hues": rooms[request.query.room].hues, "positions": rooms[request.query.room].positions })
            response.send({ "room": request.query.room, "hues": rooms[request.query.room].hues, "positions": rooms[request.query.room].positions })
        } else if (channel) {
            let room = newest++
            rooms[room] = { "hues": {} }
            rooms[room].hues[name] = hue
            rooms[room].hues[request.query.name] = request.query.hue
            channel.send({ "room": room })
            channels[room] = response
            channel = undefined
            setTimeout(function() {
                if (!rooms[room].positions) {
                    delete channels[room]
                    response.send()
                }
            }, 1000)
        } else {
            channel = response
            name = request.query.name
            hue = request.query.hue
        }
    },
    "move": function (request, response) {
        let direction = Number(request.query.direction)
        if ((request.query.axis === "x" || request.query.axis === "y") && (direction === -1 || direction === 0 || direction === 1)) {
            delete rooms[request.query.room].positions[request.query.name].bonk
            rooms[request.query.room].positions[request.query.name].move = { "axis": request.query.axis, "direction": direction }
            let opponent
            for (let index in rooms[request.query.room].hues) {
                if (index !== request.query.name) {
                    opponent = index
                    break
                }
            }
            if (rooms[request.query.room].positions[opponent].move) {
                let trajectories = {}
                for (let index in rooms[request.query.room].positions) {
                    trajectories[index] = {}
                    trajectories[index].x = rooms[request.query.room].positions[index].x
                    trajectories[index].y = rooms[request.query.room].positions[index].y
                    if (rooms[request.query.room].positions[index].move.axis === rooms[request.query.room].positions[index].axis && rooms[request.query.room].positions[index].move.direction === rooms[request.query.room].positions[index].direction) {
                        let trajectory = trajectories[index][rooms[request.query.room].positions[index].axis] + rooms[request.query.room].positions[index].direction
                        if (trajectory === -1 || trajectory === 8) {
                            rooms[request.query.room].positions[index].bonk = true
                        } else {
                            trajectories[index][rooms[request.query.room].positions[index].axis] = trajectory
                        }
                    }
                }
                if (trajectories[request.query.name].x === trajectories[opponent].x && trajectories[request.query.name].y === trajectories[opponent].y) {
                    rooms[request.query.room].positions[request.query.name].bonk = rooms[request.query.room].positions[opponent].bonk = true
                } else {
                    for (let index in trajectories) {
                        if (rooms[request.query.room].positions[index].move.direction) {
                            rooms[request.query.room].positions[index].x = trajectories[index].x
                            rooms[request.query.room].positions[index].y = trajectories[index].y
                            rooms[request.query.room].positions[index].axis = rooms[request.query.room].positions[index].move.axis
                            rooms[request.query.room].positions[index].direction = rooms[request.query.room].positions[index].move.direction
                        }
                    }
                }
                delete rooms[request.query.room].positions[request.query.name].move
                delete rooms[request.query.room].positions[opponent].move
                for (let index in trajectories[opponent]) {
                    if (rooms[request.query.room].positions[request.query.name][index] === rooms[request.query.room].positions[opponent][index]) {
                        if (index === "x") {
                            index = "y"
                        } else {
                            index = "x"
                        }
                        let order = Math.sign(rooms[request.query.room].positions[request.query.name][index] - rooms[request.query.room].positions[opponent][index])
                        if (index === rooms[request.query.room].positions[request.query.name].axis && order !== rooms[request.query.room].positions[request.query.name].direction) {
                            rooms[request.query.room].positions[request.query.name].fire = true
                        }
                        if (index === rooms[request.query.room].positions[opponent].axis && order === rooms[request.query.room].positions[opponent].direction) {
                            rooms[request.query.room].positions[opponent].fire = true
                        }
                    }
                }
                channels[request.query.room].send(rooms[request.query.room].positions)
                response.send(rooms[request.query.room].positions)
            } else {
                channels[request.query.room] = response
            }
        } else {
            response.sendStatus(400)
        }
    },
    "listen": function() {
        console.log("on port 3000")
    }
}