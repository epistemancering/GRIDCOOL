DROP TABLE IF EXISTS accounts, matches;
CREATE TABLE accounts (
    name TEXT UNIQUE,
    password TEXT,
    hue DECIMAL,
    created TIMESTAMP DEFAULT(CURRENT_TIMESTAMP)
);
CREATE TABLE matches (
    player1 TEXT,
    hue1 DECIMAL,
    player2 TEXT,
    hue2 DECIMAL,
    winner DECIMAL,
    fired TIMESTAMP DEFAULT(CURRENT_TIMESTAMP)
);