let bcryptjs = require("bcryptjs")
let sequelize = require("sequelize")
function setup(request, response) {
    let hue = Number(request.query.hue)
    if (hue > -1 && request.query.name && request.query.name.length < 9 && request.query.name[request.query.name.length - 1] !== " " && request.query.name[0] !== " ") {
        let room = Math.random()
        tokens[request.query.token] = { "room": room, "name": request.query.name }
        rooms[room] = { "hues": {}, "accounts": {} }
        rooms[room].hues[request.query.name] = hue
        if (request.query.account) {
            rooms[room].accounts[request.query.name] = true
        }
        rooms[room].channel = response
        channel.send({ "room": room })
        channel = undefined
        setTimeout(function() {
            if (!rooms[room].positions) {
                delete rooms[room]
                delete tokens[request.query.token]
                response.send()
            }
        }, 1000)
    }
}
let database = new sequelize(require("./secrets").key, {
    "dialect": "postgres",
    "dialectOptions": { "ssl": { "rejectUnauthorized": false } }
})
let tokens = []
let rooms = []
let channel
module.exports = {
    "name": function(request, response) {
        database.query("SELECT hue FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
            if (selection[0][0]) {
                response.send({ "hue": selection[0][0].hue })
            } else if (channel) {
                setup(request, response)
            } else {
                response.send()
            }
        })
    },
    "start": function(request, response) {
        if (rooms[request.query.room]) {
            database.query("SELECT password, hue FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
                if (selection[0][0]) {
                    if (bcryptjs.compareSync(request.query.password, selection[0][0].password)) {
                        hue = Number(selection[0][0].hue)
                        rooms[request.query.room].accounts[request.query.name] = true
                    }
                } else {
                    hue = Number(request.query.hue)
                }
                if (hue > -1 && request.query.name && rooms[request.query.room].hues[request.query.name] === undefined && request.query.name.length < 9 && request.query.name[request.query.name.length - 1] !== " " && request.query.name[0] !== " ") {
                    tokens[request.query.token] = { "room": request.query.room, "name": request.query.name }
                    rooms[request.query.room].hues[request.query.name] = hue
                    rooms[request.query.room].positions = {}
                    let names = Object.keys(rooms[request.query.room].hues)
                    let left = Math.floor(2 * Math.random())
                    rooms[request.query.room].positions[names[left]] = { "x": 0, "y": 0, "axis": "x", "direction": 1 }
                    rooms[request.query.room].positions[names[Number(!left)]] = { "x": 7, "y": 7, "axis": "x", "direction": -1 }
                    rooms[request.query.room].channel.send({ "hues": rooms[request.query.room].hues, "positions": rooms[request.query.room].positions })
                    response.send({ "hues": rooms[request.query.room].hues, "positions": rooms[request.query.room].positions })
                }
            })
        } else if (channel) {
            database.query("SELECT password, hue FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
                if (selection[0][0]) {
                    if (bcryptjs.compareSync(request.query.password, selection[0][0].password)) {
                        request.query.hue = selection[0][0].hue
                        request.query.account = true
                        setup(request, response)
                    }
                } else {
                    setup(request, response)
                }
            })
        } else {
            channel = response
        }
    },
    "move": function (request, response) {
        let direction = Number(request.query.direction)
        if ((request.query.axis === "x" || request.query.axis === "y") && (direction === -1 || direction === 0 || direction === 1) && tokens[request.query.token]?.room) {
            delete rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].bonk
            rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].move = { "axis": request.query.axis, "direction": direction }
            let opponent
            for (let index in rooms[tokens[request.query.token].room].hues) {
                if (index !== tokens[request.query.token].name) {
                    opponent = index
                    break
                }
            }
            if (rooms[tokens[request.query.token].room].positions[opponent].move) {
                let trajectories = {}
                for (let index in rooms[tokens[request.query.token].room].positions) {
                    trajectories[index] = {}
                    trajectories[index].x = rooms[tokens[request.query.token].room].positions[index].x
                    trajectories[index].y = rooms[tokens[request.query.token].room].positions[index].y
                    if (rooms[tokens[request.query.token].room].positions[index].move.axis === rooms[tokens[request.query.token].room].positions[index].axis && rooms[tokens[request.query.token].room].positions[index].move.direction === rooms[tokens[request.query.token].room].positions[index].direction) {
                        let trajectory = trajectories[index][rooms[tokens[request.query.token].room].positions[index].axis] + rooms[tokens[request.query.token].room].positions[index].direction
                        if (trajectory === -1 || trajectory === 8) {
                            rooms[tokens[request.query.token].room].positions[index].bonk = true
                        } else {
                            trajectories[index][rooms[tokens[request.query.token].room].positions[index].axis] = trajectory
                        }
                    }
                }
                if (trajectories[tokens[request.query.token].name].x === trajectories[opponent].x && trajectories[tokens[request.query.token].name].y === trajectories[opponent].y) {
                    rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].bonk = rooms[tokens[request.query.token].room].positions[opponent].bonk = true
                } else {
                    for (let index in trajectories) {
                        if (rooms[tokens[request.query.token].room].positions[index].move.direction) {
                            rooms[tokens[request.query.token].room].positions[index].x = trajectories[index].x
                            rooms[tokens[request.query.token].room].positions[index].y = trajectories[index].y
                            rooms[tokens[request.query.token].room].positions[index].axis = rooms[tokens[request.query.token].room].positions[index].move.axis
                            rooms[tokens[request.query.token].room].positions[index].direction = rooms[tokens[request.query.token].room].positions[index].move.direction
                        }
                    }
                }
                delete rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].move
                delete rooms[tokens[request.query.token].room].positions[opponent].move
                for (let index in trajectories[opponent]) {
                    if (rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name][index] === rooms[tokens[request.query.token].room].positions[opponent][index]) {
                        if (index === "x") {
                            index = "y"
                        } else {
                            index = "x"
                        }
                        let order = Math.sign(rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name][index] - rooms[tokens[request.query.token].room].positions[opponent][index])
                        if (index === rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].axis && order !== rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].direction) {
                            rooms[tokens[request.query.token].room].positions[tokens[request.query.token].name].fire = true
                            rooms[tokens[request.query.token].room].winner = "1"
                        }
                        if (index === rooms[tokens[request.query.token].room].positions[opponent].axis && order === rooms[tokens[request.query.token].room].positions[opponent].direction) {
                            rooms[tokens[request.query.token].room].positions[opponent].fire = true
                            if (rooms[tokens[request.query.token].room].winner) {
                                rooms[tokens[request.query.token].room].winner = "0"
                            } else {
                                rooms[tokens[request.query.token].room].winner = "2"
                            }
                        }
                    }
                }
                rooms[tokens[request.query.token].room].channel.send(rooms[tokens[request.query.token].room].positions)
                response.send(rooms[tokens[request.query.token].room].positions)
                if (rooms[tokens[request.query.token].room].winner) {
                    for (let index in trajectories) {
                        if (rooms[tokens[request.query.token].room].accounts[index]) {
                            rooms[tokens[request.query.token].room].hues[index] = "NULL"
                        }
                    }
                    database.query(`
                        INSERT INTO matches (player1, hue1, player2, hue2, winner) VALUES
                            ('${tokens[request.query.token].name}', ${rooms[tokens[request.query.token].room].hues[tokens[request.query.token].name]}, '${opponent}', ${rooms[tokens[request.query.token].room].hues[opponent]}, ${rooms[tokens[request.query.token].room].winner})
                        ;
                    `).then(function() {
                        delete rooms[tokens[request.query.token].room]
                    })
                }
            } else {
                rooms[tokens[request.query.token].room].channel = response
            }
        }
    },
    "postAccount": function(request, response) {
        let hue = Number(request.query.hue)
        if (hue > -1 && request.query.name && request.query.name.length < 9 && request.query.name[request.query.name.length - 1] !== " " && request.query.name[0] !== " ") {
            database.query(`
                UPDATE matches SET hue1 = NULL WHERE fired = (
                    SELECT MAX(fired) FROM (
                        SELECT * FROM matches WHERE player1 = '${request.query.name}'
                        UNION
                        SELECT * FROM matches WHERE player2 = '${request.query.name}'
                    ) AS records
                ) AND player1 = '${request.query.name}' AND NOT EXISTS (
                    SELECT name FROM accounts WHERE name = '${request.query.name}'
                );
                UPDATE matches SET hue2 = NULL WHERE fired = (
                    SELECT MAX(fired) FROM (
                        SELECT * FROM matches WHERE player1 = '${request.query.name}'
                        UNION
                        SELECT * FROM matches WHERE player2 = '${request.query.name}'
                    ) AS records
                ) AND player2 = '${request.query.name}' AND NOT EXISTS (
                    SELECT name FROM accounts WHERE name = '${request.query.name}'
                );
                INSERT INTO accounts (name, password, hue) SELECT '${request.query.name}', '${bcryptjs.hashSync(request.query.password)}', ${hue} WHERE NOT EXISTS (
                    SELECT name FROM accounts WHERE name = '${request.query.name}'
                );
            `).then(function() {
                response.send()
            })
        }
    },
    "getAccount": function(request, response) {
        database.query("SELECT password FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
            if (request.query.password && selection[0][0]) {
                response.send([bcryptjs.compareSync(request.query.password, selection[0][0].password)])
            }
        })
    },
    "putAccount": function(request, response) {
        database.query("SELECT password FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
            if (request.query.password && selection[0][0] && bcryptjs.compareSync(request.query.password, selection[0][0].password)) {
                database.query("UPDATE accounts SET password = '" + bcryptjs.hashSync(request.query.updated) + "' WHERE name = '" + request.query.name + "';").then(function() {
                    response.send()
                })
            }
        })
    },
    "deleteAccount": function(request, response) {
        database.query("SELECT password FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
            if (request.query.password && selection[0][0] && bcryptjs.compareSync(request.query.password, selection[0][0].password)) {
                database.query(`
                    DELETE FROM matches WHERE (player1 = '${request.query.name}' AND hue1 IS NULL) OR (player2 = '${request.query.name}' AND hue2 IS NULL);
                    DELETE FROM accounts WHERE name = '${request.query.name}';
                `).then(function() {
                    response.send()
                })
            }
        })
    },
    "records": function(request, response) {
        database.query("SELECT password FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
            if (request.query.password && selection[0][0] && bcryptjs.compareSync(request.query.password, selection[0][0].password)) {
                database.query(`
                    SELECT fired, player1, hue, winner FROM matches
                        JOIN accounts ON player1 = name WHERE player2 = '${request.query.name}' AND hue1 IS NULL AND hue2 IS NULL;
                    SELECT fired, player2, hue, winner FROM matches
                        JOIN accounts ON player2 = name WHERE player1 = '${request.query.name}' AND hue2 IS NULL AND hue1 IS NULL;
                    SELECT fired, player1, hue1, winner FROM matches WHERE player2 = '${request.query.name}' AND hue1 IS NOT NULL AND hue2 IS NULL;
                    SELECT fired, player2, hue2, winner FROM matches WHERE player1 = '${request.query.name}' AND hue2 IS NOT NULL AND hue1 IS NULL;
                `).then(function(selection) {
                    response.send(selection[0])
                })
            }
        })
    },
    "hue": function(request, response) {
        database.query("SELECT password FROM accounts WHERE name = '" + request.query.name + "';").then(function(selection) {
            let hue = Number(request.query.hue)
            if (hue > -1 && request.query.password && selection[0][0] && bcryptjs.compareSync(request.query.password, selection[0][0].password)) {
                database.query("UPDATE accounts SET hue = " + hue + " WHERE name = '" + request.query.name + "';").then(function() {
                    response.send()
                })
            }
        })
    },
    "listen": function() {
        console.log("on port 3000")
    }
}