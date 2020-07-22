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
    let access_token;
    let refresh_token;
    if(state === null || state != storedState) {
        res.redirect('/#' + querystring.stringify({
            error: 'state_mismatch'
        }));
    } else {
        res.clearCookie(stateKey);
        const headers = {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: client_id,
              password: client_secret,
            },
          };
          const data = {
            code,
            redirect_uri,
            grant_type: 'authorization_code'
          };
        
          try {
             axios.post(
              'https://accounts.spotify.com/api/token',
              querystring.stringify(data),
              headers
            )
            .then((response) => {
                access_token = response.data.access_token;
                refresh_token = response.data.refresh_token;
                res.redirect('http://localhost:3000/#' + 
                querystring.stringify({
                    access_token,
                    refresh_token
                }))
            })
            .catch((error))
            {
                console.log('error!!!'+error);
                res.redirect('http://localhost:3000/#' + 
                    querystring.stringify({
                        error: 'invalid_token'
                    }))
            }
          } catch (error) {
            
          }
    }
});


app.get('/topsongs',(req,res) => {
    let result=[];
    console.log(req.query.token);
    const headers = {
          headers: { 'Authorization': 'Bearer ' + req.query.token},
          params: {
            limit: '30'
          }
    }
        axios.get('https://api.spotify.com/v1/me/top/tracks?', headers)
        .then((response) => {
            if(response.data.items != undefined){
                response.data.items.forEach(item => {
                    let obj = {
                        artist: item.artists[0].name,
                        song: item.name,
                        img: item.album.images[1].url
                    }
                    console.log('artist -> '+ item.artists[0].name);
                    console.log('song -> ' + item.name)
                    result.push(obj);
                })
                res.send({'result': result})
            }
        })
        .catch((err) => {
            console.log(err);
        })
    
});

app.get('/topartists',(req,res) => {
    let result=[];
    console.log(req.query.token);
    const headers = {
          headers: { 'Authorization': 'Bearer ' + req.query.token},
          params: {
            limit: '30'
          }
    }
        axios.get('https://api.spotify.com/v1/me/top/artists?', headers)
        .then((response) => {
            if(response.data.items != undefined){
                response.data.items.forEach(item => {
                    let genres = item.genres.map((genre) => {
                        if(genre.length > 1)
                        {
                            return genre + ' ';
                        }
                    })
                    let obj = {
                        genres,
                        artist: item.name,
                        img: item.images[1].url,
                        id: item.id
                    }
                    result.push(obj);
                })
                res.send({'result': result})
            }
        })
        .catch((err) => {
            console.log(err);
        })
    
});





app.listen(port);
