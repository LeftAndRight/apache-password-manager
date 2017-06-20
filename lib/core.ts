import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as minimist from 'minimist';
import * as md5 from "apache-md5";

let args = minimist(process.argv.slice(2));
let source:string;
inquirer
    .prompt([
        {type:"input", name:"source", message:"Please enter the source .htpassword file location", default:args["source"] || ".htpasswd"},
        {type:"list", name:"action", message:"What would you like to do?", choices:[
            {name:"List all usernames", value:"list"},
            {name:"Add a user", value:"add"},
            {name:"Edit a user", value:"edit"},
            {name:"Delete a user", value:"delete"},
        ]}
    ])
    .then((answers) => {
        // load and parse the current file
        source          = answers["source"];
        let currentFile = fs.readFileSync(source, "utf-8");

        let lines   = currentFile.split("\n");
        let users   = [];
        if (lines){
            lines.forEach(line => {
                if (line != ""){
                    let lineParts = line.split(":");
                    users.push({username:lineParts[0], password:lineParts[1]});
                }
            });
        }

        // Do the next action
        switch (answers["action"]){
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

const doList = (users) => {
    users.forEach((user, i) => console.log((i + 1) + ") " + user.username));
};

const doAdd = (users) => {
    return inquirer
        .prompt([
            {type:"input", name:"username", message:"Please enter the username:"},
            {type:"password", name:"password", message:"Please enter the password:"}
        ])
        .then(answers => {
            let hashed = md5(answers["password"]);
            // Check for duplicate usernames
            let passed = true;
            for (var i = 0; i < users.length; i++) {
                if (answers["username"] == users[i].username){
                    passed = false;
                    console.log("[ERROR] Username already in use");
                    break;
                }
            }
            if (passed){
                users.push({username:answers["username"], password:hashed});
                persistUsers(users);
            }
        })
};

const doEdit = (users) => {
    return inquirer
        .prompt([
            {type:"list", name:"selection", message:"Please select the user to edit", choices:users.map(user => {
                return {name:user.username, value:user.username};
            })},
            {type:"password", name:"password", message:"Please enter the new password:"}
        ])
        .then(answers => {
            for (var i = 0; i < users.length; i++) {
                if (users[i].username == answers["selection"]){
                    users[i].password = md5(answers["password"]);
                    persistUsers(users);
                    break;
                }
            }
        });
};

const doDelete = (users) => {
    return inquirer
        .prompt({type:"list", name:"selection", message:"Please select the user to delete", choices:users.map(user => {
            return {name:user.username, value:user.username};
        })})
        .then(answers => {
            for (var i = 0; i < users.length; i++) {
                if (users[i].username == answers["selection"]){
                    users.splice(i, 1);
                    break;
                }
            }
            persistUsers(users);
        })
        ;
};

const persistUsers = (users) => {
    let output = "";
    users.forEach(user => {
        output += user.username + ":" + user.password + "\n";
    });
    fs.writeFileSync(source, output, "utf-8");
};