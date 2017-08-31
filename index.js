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
{ token: '2P429UX-------',
  team_id: 'T1L---',
  team_domain: 'girliemac',
  channel_id: 'C1L---',
  channel_name: 'general',
  user_id: 'U1L----',
  user_name: 'girlie_mac',
  command: '/httpstatus',
  text: '405',
  response_url: 'https://hooks.slack.com/commands/--- }
*/

function handleQueries(q, res) {
  if(q.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    res.send('Sorry something went wrong');
    return;
  }
  if (q.text) {
    let amount = parseFloat(q.text);

    if(isNaN(amount)) { // not a digit
      res.send('Please eneter a valid amount');
      return;
    }

    bittrex.getmarketsummary( { market : 'USDT-BTC'}, function( data, err ) {
      const satoshi = 0.00000001;
      const bitcoinPriceUsd = data.result[0].Last;
      const usd = bitcoinPriceUsd * (amount * satoshi);

      let json = {
        response_type: 'in_channel', // public to the channle
        text: '$' + usd.toString(),
      };
      res.json(json);
    });

  } else {
    let json = {
      response_type: 'ephemeral', // private message
      text: 'How to use /satoshi command:',
      attachments:[
      {
        text: 'Type a value after the command, e.g. `/satoshi 100`',
      }
    ]};
    res.json(json);
  }
}