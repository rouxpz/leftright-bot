const express = require('express');
// const say = require('say');
const fs = require('fs');
const request = require('request');
const app = express();
const { Client } = require('pg');
const port = 3000;
const bodyParser = require('body-parser');
const rita = require('rita');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));

//TO DO:
//affect levels??

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/template1'
});

client.connect();

let urlBase = 'https://roopavasudevan.com/dump/bot-json/';
let leftFiles = ['nick.json'];
let rightFiles = ['kimberly.json'];

let rightData = [];
let leftData = [];

let loading = true;

//get today's date for the conversation
let dateOb = new Date();
let todaysDate = dateOb.getFullYear() + "-" + (dateOb.getMonth() + 1) + "-" + dateOb.getDate();
console.log(todaysDate);

for (var i = 0; i < leftFiles.length; i++) {
  request({
    url: urlBase + leftFiles[i],
    json: true
  }, function(error, response, body){
    if (!error && response.statusCode === 200) {
      // console.log(body.data.length);
      leftData = leftData.concat(body.data);
      console.log("left data length: " + leftData.length)
    }
  })
}

for (var i = 0; i < rightFiles.length; i++) {
  request({
    url: urlBase + rightFiles[i],
    json: true
  }, function(error, response, body){
    if (!error && response.statusCode === 200) {
      rightData = rightData.concat(body.data);
      console.log("right data length: " + rightData.length)
    }
  })
}

let rightCorpus = '';
let leftCorpus = '';

let currentStatement = '';
let currentTopic = "virus";
let currentTopics = ['virus'];
let pastTopics = ['virus'];
let pastData;

let toggle = false;

let order = 0;
let queue = 0;


app.get('/', (req, res) => {

  //     client.query('INSERT INTO lrbot(left_text, right_text, id, generated_on) VALUES($1, $2, $3, $4)', [toLoad[1], toLoad[0], order, todaysDate]);

  res.render('index', {leftData:'', rightData:'', voice:''});
  pastData = {leftData:'', rightData:'', voice:''};
});

app.post('/', (req, res) => {
  let side;
  console.log(req.body.side);

  //determine side
  if (toggle == false) {
    side = "right";
    toggle = true;
  } else {
    side = "left";
    toggle = false;
  }

  // console.log(side);
  //parse current fragment for topics, either from last thing said or from user input
  if (req.body.userInput != '') {
    currentStatement = req.body.userInput;
    pastData = {leftData:'', rightData:'', voice:''};
  } else {
    currentStatement = currentStatement;
  }

  console.log(currentStatement);
  currentStatement = currentStatement.toLowerCase().replace('.', '').replace(',', '');
  currentStatement = currentStatement.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  currentTopics = currentStatement.split(' ');
  // console.log(currentTopics);

  //send to function that generates new text
  let dataToAdd;
  let newData = generateConvo(side, currentTopics);
  // console.log("data added:")
  // console.log(newData)

  if (newData[0] == '') {
    dataToAdd = {
      leftData: newData[1],
      rightData: pastData.rightData,
      voice: 'leftVoice'
    }
  } else {
    dataToAdd = {
      leftData: pastData.leftData,
      rightData: newData[0],
      voice: 'rightVoice'
    }
  }

  pastData = dataToAdd;
  // client.query('INSERT INTO lrbot(left_text, right_text, id, generated_on) VALUES($1, $2, $3, $4)', [dataToAdd[1], dataToAdd[0], order, todaysDate]);
  // order = order + 1;

  res.render('index', dataToAdd);

  // client.query("SELECT * FROM lrbot WHERE generated_on = $1 AND id = $2", [todaysDate, queue], (err, result) => {
  //   if (err) throw err;
  //   let output = result.rows[0];
  //   // console.log(output.left_text);
  //   res.render('index', {leftData:output.left_text, rightData:output.right_text});
  // });
  //
  // queue = queue + 1;

})

app.get('/voices', (req, res) => {
  res.render('voices');
})

function generateConvo(s, t) {
  let toAdd;
  let tags;
  let toSend = [];
  let rm = rita.RiMarkov(5);
  let sentenceStarts = ["Didn't you know that***?", "You should be aware that***.", "You're wrong,***.", "The truth is that***.", "Just admit that***!"]
  // console.log(t);

  if (s == "right") {
    toAdd = [];
    tags = [];
    rightCorpus = '';

    // console.log("tags refreshed at " + tags.length);

    //check tags sent from last statement against the text metadata
    for (var i = 0; i < rightData.length; i++) {
      for (var j = 0; j < t.length; j++) {
        if (rightData[i].metadata.includes(t[j]) == true && tags.includes(t[j]) == false) {
          tags.push(t[j]);
          console.log(tags.length);
        }
      }

      //keep the same tags if there's no overlap
      if (tags.length < 1) {
        tags = pastTopics;
      } else {
        pastTopics = [];
        // console.log("past topics: " + pastTopics.length);
      }

      //filter out articles based on metadata
      for (j = 0; j < tags.length; j++) {
        if (rightData[i].metadata.includes(tags[j]) == true && toAdd.includes(rightData[i].text) == false) {
          toAdd.push(rightData[i].text);

          // console.log("adding to corpus...");
          rm.loadText(rightData[i].text);
        }
      }
    }
    // console.log("number of articles: " + toAdd.length);
    rightCorpus  = toAdd.join(' ');

    var start = sentenceStarts[Math.floor(Math.random() * sentenceStarts.length)];
    // console.log("writing sentences...");
    let sentences = rm.generateSentences(1);
    let joinedSents = sentences.join();
    joinedSents = joinedSents.replace('.,', '. ');
    joinedSents = joinedSents[0].toLowerCase() + joinedSents.substr(1, joinedSents.length - 2);
    var statement = start.replace('***', ' ' + joinedSents);
    currentStatement = statement;
    toSend = [statement, ''];

    //save the tags used to generate this round
    pastTopics = tags;
    // console.log(pastTopics);

  } else if (s == "left") {
    toAdd = [];
    tags = [];
    leftCorpus = '';

    // console.log("tags refreshed at " + tags.length);

    //check tags sent from last statement against the text metadata
    for (var i = 0; i < leftData.length; i++) {
      for (var j = 0; j < t.length; j++) {
        if (leftData[i].metadata.includes(t[j]) == true && tags.includes(t[j]) == false) {
          tags.push(t[j]);
          // console.log(tags.length);
        }
      }

      //keep the same tags if there's no overlap
      if (tags.length < 1) {
        tags = pastTopics;
      } else {
        pastTopics = []
        // console.log("past topics: " + pastTopics.length);
      }

      //filter out articles based on metadata
      for (j = 0; j < tags.length; j++) {
        if (leftData[i].metadata.includes(tags[j]) == true && toAdd.includes(leftData[i].text) == false) {
          toAdd.push(leftData[i].text);

          // console.log("adding to corpus...");
          rm.loadText(leftData[i].text);
        }
      }
    }
    // console.log("number of articles: " + toAdd.length);
    // leftCorpus  = toAdd.join(' ');

    //generate new text
    // rm.loadText(leftCorpus);
    // console.log("writing sentences...");
    var start = sentenceStarts[Math.floor(Math.random() * sentenceStarts.length)];
    // console.log("writing sentences...");
    let sentences = rm.generateSentences(1);
    let joinedSents = sentences.join();
    joinedSents = joinedSents.replace('.,', '. ');
    joinedSents = joinedSents[0].toLowerCase() + joinedSents.substr(1, joinedSents.length - 2);
    var statement = start.replace('***', ' ' + joinedSents);
    currentStatement = statement;
    toSend = ['', statement];

    //save the tags used to generate this round
    pastTopics = tags;
    // console.log(pastTopics);
  }

  return toSend;
}

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
