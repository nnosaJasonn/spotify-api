const express = require('express');
const request = require('request');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();
const cors = require('cors');
const querystring = require('querystring');
var cookieParser = require('cookie-parser');
const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
redirect_uri = 'http://localhost:8888/callback';
console.log('client-id => ' +client_id);
const port = process.env.PORT || 8888;


const app = express();


let stateKey = 'spotify_auth_state';

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/login', (req, res) => {
    let state = 'abcdefghijklmnop';
    res.cookie(stateKey, state);

    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        response_type: 'code',
        client_id:'ff4cb947f4b34f5f816b97f5cda2e687', 
        scope: 'user-top-read',
        redirect_uri: redirect_uri,
        state: state
    }))
});

app.get('/callback', (req,res) => {
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null
    if(state === null || state != storedState) {
        res.redirect('/#' + querystring.stringify({
            error: 'state_mismatch'
        }));
    } else {
        res.clearCookie(stateKey);
        let authOptions = {
            url: 'https://accounts.spotify.com/api/token', 
            form: {
                code,
                redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };
        request.post(authOptions, (error, response, body) => {
            if(!error && response.statusCode === 200) {
                let access_token = body.access_token,
                    refresh_token = body.refresh_token;
                    let options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: { 'Authorization' : 'Bearer ' + access_token},
                        json: true
                    }
                    console.log('access_token -> ' + access_token);
                    console.log('refresh_token -> ' + refresh_token);
                    
                    request.get(options, (error, response, body) => {
                        console.log(body);
                    })
                res.redirect('http://localhost:3000/#' + 
                    querystring.stringify({
                        access_token,
                        refresh_token
                    }))
                
            } else {
                res.redirect('http://localhost:3000/#' + 
                    querystring.stringify({
                        error: 'invalid_token'
                    }))
            }
        })
    }
});

app.get('/refresh_token',(req,res) => {
    refresh_token = req.query.refresh_token;
    let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
        form: {
            grant_type: 'refresh_token',
            refresh_token
        },
        json: true
    }

    request.post(authOptions, (error, response, body) => {
        if(!error && response.statusCode == 200) {
            let access_token = body.access_token;
            res.send({
                'access_token' : access_token
            })
        }
    })
})

app.get('/topsongs',(req,res) => {
    let result=[];

    let authOptions = {
        url: 'https://api.spotify.com/v1/me/top/tracks?',
        headers: { 'Authorization': 'Bearer ' + req.query.token},
        json: true
    }

    request.get(authOptions, (error, response, body) => {
        console.log(error)
        if(!error && response.statusCode == 200) 
        {

        
        if(body != undefined)
        body.items.forEach(item => {
            let obj = {
                artist: item.artists[0].name,
                song: item.name
            }
            console.log('artist -> '+ item.artists[0].name);
            console.log('song -> ' + item.name)
            result.push(obj);
        })
        res.send({'result': result})
    }
    })


})




app.listen(port);