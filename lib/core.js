"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var inquirer = require("inquirer");
var minimist = require("minimist");
var md5 = require("apache-md5");
var args = minimist(process.argv.slice(2));
var source;
inquirer
    .prompt([
    { type: "input", name: "source", message: "Please enter the source .htpassword file location", default: args["source"] || ".htpasswd" },
    { type: "list", name: "action", message: "What would you like to do?", choices: [
            { name: "List all usernames", value: "list" },
            { name: "Add a user", value: "add" },
            { name: "Edit a user", value: "edit" },
            { name: "Delete a user", value: "delete" },
        ] }
])
    .then(function (answers) {
    // load and parse the current file
    source = answers["source"];
    var currentFile = fs.readFileSync(source, "utf-8");
    var lines = currentFile.split("\n");
    var users = [];
    if (lines) {
        lines.forEach(function (line) {
            if (line != "") {
                var lineParts = line.split(":");
                users.push({ username: lineParts[0], password: lineParts[1] });
            }
        });
    }
    // Do the next action
    switch (answers["action"]) {
        case "list":
            return doList(users);
        case "add":
            return doAdd(users);
        case "edit":
            return doEdit(users);
        case "delete":
            return doDelete(users);
    }
});
var doList = function (users) {
    users.forEach(function (user, i) { return console.log((i + 1) + ") " + user.username); });
};
var doAdd = function (users) {
    return inquirer
        .prompt([
        { type: "input", name: "username", message: "Please enter the username:" },
        { type: "password", name: "password", message: "Please enter the password:" }
    ])
        .then(function (answers) {
        var hashed = md5(answers["password"]);
        // Check for duplicate usernames
        var passed = true;
        for (var i = 0; i < users.length; i++) {
            if (answers["username"] == users[i].username) {
                passed = false;
                console.log("[ERROR] Username already in use");
                break;
            }
        }
        if (passed) {
            users.push({ username: answers["username"], password: hashed });
            persistUsers(users);
        }
    });
};
var doEdit = function (users) {
    return inquirer
        .prompt([
        { type: "list", name: "selection", message: "Please select the user to edit", choices: users.map(function (user) {
                return { name: user.username, value: user.username };
            }) },
        { type: "password", name: "password", message: "Please enter the new password:" }
    ])
        .then(function (answers) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].username == answers["selection"]) {
                users[i].password = md5(answers["password"]);
                persistUsers(users);
                break;
            }
        }
    });
};
var doDelete = function (users) {
    return inquirer
        .prompt({ type: "list", name: "selection", message: "Please select the user to delete", choices: users.map(function (user) {
            return { name: user.username, value: user.username };
        }) })
        .then(function (answers) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].username == answers["selection"]) {
                users.splice(i, 1);
                break;
            }
        }
        persistUsers(users);
    });
};
var persistUsers = function (users) {
    var output = "";
    users.forEach(function (user) {
        output += user.username + ":" + user.password + "\n";
    });
    fs.writeFileSync(source, output, "utf-8");
};
