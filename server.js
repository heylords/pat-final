const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const MySQLEvents = require('mysql-events');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const app = express();

//create server
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const dsn = {
    host:     'localhost',
    user:     'root',
    password: 'jamora01',
};

const mysqlEventWatcher = MySQLEvents(dsn);
const watcher = mysqlEventWatcher.add(
    'pgluxmas.prizes',
    function (oldRow, newRow, event) {
        if (oldRow !== null && newRow !== null) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newRow.fields));
                    //console.log(newRow.fields);
                }
            });
        }
    },
    'Active'
);

//this is for session
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const sessionParser = session({
  saveUninitialized: false,
  secret: 'pglusession',
  resave: false
});

app.use(sessionParser);

//this is for directory detection
app.use(express.static(path.join(__dirname, '')));

//this is for connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jamora01',
    database: 'pgluxmas'
});

//connection checl
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

//session check for login
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'res', 'slido.html'));
    } else {
        res.sendFile(path.join(__dirname, 'res', 'login.html'));
    }
});

//login check
app.post('/auth', (req, res) => {
    const username = req.body.idno;
    const password = req.body.password;
    if (username && password) {
        const sql = 'SELECT * FROM user WHERE idno = ? AND password = ?';
        db.query(sql, [username, password], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                req.session.name = results[0].fname;
                req.session.office = results[0].office;
                console.log(results[0].fname);
                res.redirect('/');
            } else {
                res.status(401).send('Incorrect Username and/or Password!');
            }
        });
    } else {
        res.status(400).send('Please enter Username and Password!');
    }
});

//getPrize module for click function
app.post('/getPrize', (req, res) => {
    const id = req.body.id;
    const idno = req.session.username;
    // console.log(id+' and '+idno);

    const check = `SELECT * from prizes WHERE claimed_by = ${mysql.escape(idno)}`;

    db.query(check, (err, results) => {
        if (err) throw err;
        // console.log(results.length);
        if(results.length > 0){
            res.send("claimed");
        }else{
            const sql = `UPDATE prizes SET status = 'claimed', claimed_by = ${mysql.escape(idno)} WHERE idno = ${mysql.escape(id)} AND status = 'unclaimed'`;

            db.query(sql, (err, result) => {
                if (err) throw err;
                
                if(result.affectedRows > 0){
                    res.send("updated");
                }else{
                    res.send("The prize is either already claimed or does not exist.");
                }
            });
        }
    });
        
});

//getprize status
app.post('/getPrizeStatus', (req, res) => {
    const id = req.body.id;
    if (id) {
        
        const sql = 'SELECT * FROM prizes WHERE idno = ?';
        db.query(sql, [id], (err, result) => {
            if (err) throw err;
            if(result[0].status=="claimed"){
                const sql2 = `SELECT * FROM user WHERE idno = ${mysql.escape(result[0].claimed_by)}`;
                db.query(sql2, (err, results) => {
                    if (err) throw err;
                    res.send({user:results[0], prizes:result[0]});
                });
            }else{
                res.send(result[0]);
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid request' });
    }
});

//session active state
let activeUsers = {};

// server.on('upgrade', function(request, socket, head) {
//   console.log('Parsing session from request...');

//   sessionParser(request, {}, () => {
//         if (!request.session.name) {
//         socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
//         socket.destroy();
//         return;
//         }

//         console.log('Session is parsed!');

//         wss.handleUpgrade(request, socket, head, function(ws) {
//         wss.emit('connection', ws, request);
//         });
//     });
// });

// wss.on('connection', function(ws, request) {
//     // We should have access to the session here
//     console.log('New connection:', request.session);

//     let idno = request.session.username;
    
//     if(activeUsers[idno]) {
//         // Increment the count of active connections for this user
//         activeUsers[idno].count++;
//     } else {
//         activeUsers[idno] = {
//             ws: ws,
//             username: request.session.name,
//             office: request.session.office,
//             idno: idno,
//             count: 1  // Initialize the count of active connections for this user
//         };
//     }
//     // Send the updated list of active users to all connected clients
//     let activeUserInfo = Object.values(activeUsers).map(user => ({name: user.username, office: user.office, idno: user.idno}));
//     let data = {
//         type: 'activeUsers',
//         data: activeUserInfo // the data from the WebSocket listeners
//     };
//     wss.clients.forEach(function(client) {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(data));
//             // console.log(data);
//         }
//     });
    


//     ws.on('close', function() {

//       activeUsers[idno].count--;
//       console.log(activeUsers[idno].count);
//       if(activeUsers[idno].count === 0) {
//         console.log('Connection closed for ', idno);
//         delete activeUsers[idno];
//       }
      
         
//     //   Send the updated list of active users to all connected clients
//     activeUserInfo = Object.values(activeUsers).map(user => ({name: user.username, office: user.office, idno: user.idno}));
//       let data = {
//         type: 'activeUsers',
//         data: activeUserInfo // the data from the WebSocket listeners
//       };
//       wss.clients.forEach(function(client) {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify(data));
//           console.log(data);
//         }
//       });
//     });
// });  

server.on('upgrade', (request, socket, head) => {
  sessionParser(request, {}, () => {
        if (!request.session.name) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        console.log('Session is parsed!');   

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
  });
  
wss.on('connection', function(ws, request) {
    // We should have access to the session here
    console.log('New connection:', request.session);

    let idno = request.session.username;
    
    if(activeUsers[idno]) {
        // Increment the count of active connections for this user
        activeUsers[idno].count++;
    } else {
        activeUsers[idno] = {
            ws: ws,
            username: request.session.name,
            office: request.session.office,
            idno: idno,
            count: 1  // Initialize the count of active connections for this user
        };
    }
    // Send the updated list of active users to all connected clients
    let activeUserInfo = Object.values(activeUsers).map(user => ({name: user.username, office: user.office, idno: user.idno}));
    let data = {
        type: 'activeUsers',
        data: activeUserInfo // the data from the WebSocket listeners
    };
    wss.clients.forEach(function(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
            // console.log(data);
        }
    });
    // console.log("connected");

    ws.on('close', function() {

        activeUsers[idno].count--;
        console.log(activeUsers[idno].count);
        if(activeUsers[idno].count === 0) {
        console.log('Connection closed for ', idno);
        delete activeUsers[idno];
        }
               
        //   Send the updated list of active users to all connected clients
        activeUserInfo = Object.values(activeUsers).map(user => ({name: user.username, office: user.office, idno: user.idno}));
        let data = {
            type: 'activeUsers',
            data: activeUserInfo // the data from the WebSocket listeners
        };
        wss.clients.forEach(function(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
                console.log(data);
            }
        });
    });
});
  
server.listen(3000, function () {
    console.log("Listening on port 3000.");
});