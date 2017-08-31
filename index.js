'use strict';

require('dotenv').config();
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const bittrex = require('node.bittrex.api');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

bittrex.options({
  'apikey' : process.env.BITTREX_API_KEY,
  'apisecret' :  process.env.BITTREX_API_SECRET,
  'stream' : false,
  'verbose' : false,
  'cleartext' : false
});


const server = app.listen(process.env.PORT || 8080, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


app.get('/', (req, res) => {
  handleQueries(req.query, res);
});

app.post('/', (req, res) => {
  handleQueries(req.body, res);
});

/*
response:
{ token: 'some token',
  team_id: 'T1L---',
  team_domain: 'some-domain',
  channel_id: 'C1L---',
  channel_name: 'general',
  user_id: 'U1L----',
  user_name: 'some user',
  command: '/satoshi',
  text: '1000',
  response_url: 'https://hooks.slack.com/commands/--- }
*/

function handleQueries(q, res) {
  if (q.text) {
    const amountOfSatoshi = parseFloat(q.text);

    if(isNaN(amountOfSatoshi)) { // not a digit
      res.send('Please eneter a valid amount');
      return;
    }

    bittrex.getmarketsummary( { market : 'USDT-BTC'}, function( data, err ) {
      const satoshi = 0.0000001;
      const bitcoinPriceUsd = data.result[0].Last;
      const usd = bitcoinPriceUsd * (amountOfSatoshi * satoshi);

      const json = {
        response_type: 'in_channel', // public to the channel
        text: '$' + usd.toFixed(2).toString(),
      };
      res.json(json);
    });

  } else {
    const json = {
      response_type: 'ephemeral', // private message
      text: 'How to use /satoshi command:',
      attachments:[
      {
        text: 'Type a value after the command, e.g. `/satoshi 1000`',
      }
    ]};
    res.json(json);
  }
}