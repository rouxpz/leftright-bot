const express = require('express');
const say = require('say');
const fs = require('fs');
const request = require('request');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const rita = require('rita');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));

//TO DO:
//automate back and forth discussion between bots
let urlBase = 'https://roopavasudevan.com/dump/bot-json/';
let leftFiles = ['climate-change-left.json', 'covid-left.json', 'immigration-left.json'];
let rightFiles = ['climate-change-right.json', 'covid-right.json', 'immigration-right.json'];

let rightData = [];
let leftData = [];

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
let currentTopic = "election";
let currentTopics = ['election'];
let pastTopics = ['election'];

let toggle = false;


app.get('/', (req, res) => {
  // setTimeout(myFunc, 1500, 'funky');
  res.render('index', {leftData:'', rightData:''});
});

app.post('/', (req, res) => {
  let side;

  //determine side
  if (toggle == false) {
    side = "right";
    toggle = true;
  } else {
    side = "left";
    toggle = false;
  }

  //parse current fragment for topics, either from last thing said or from user input
  if (req.body.userInput != '') {
    currentStatement = req.body.userInput;
  } else {
    currentStatement = currentStatement;
  }

  console.log(currentStatement);
  currentStatement = currentStatement.toLowerCase().replace('.', '').replace(',', '');
  currentStatement = currentStatement.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  currentTopics = currentStatement.split(' ');
  // console.log(currentTopics);

  //send to function that generates new text
  let dataToUse = generateConvo(side, currentTopics);

  res.render('index', {leftData:dataToUse[1], rightData:dataToUse[0]});

})

function generateConvo(s, t) {
  let toAdd;
  let tags;
  let toSend = [];
  let rm = rita.RiMarkov(5);
  // console.log(t);

  if (s == "right") {
    toAdd = [];
    tags = [];
    rightCorpus = '';

    console.log("tags refreshed at " + tags.length);

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
    console.log("number of articles: " + toAdd.length);
    rightCorpus  = toAdd.join(' ');


    console.log("writing sentences...");
    let sentences = rm.generateSentences(2);
    let statement = sentences.join();
    statement = statement.replace('.,', '. ');
    currentStatement = statement;
    toSend = [statement, ''];

    //TTS statement
    say.speak(statement, 'Victoria');

    //save the tags used to generate this round
    pastTopics = tags;
    console.log(pastTopics);

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
    console.log("number of articles: " + toAdd.length);
    // leftCorpus  = toAdd.join(' ');

    //generate new text
    // rm.loadText(leftCorpus);
    console.log("writing sentences...");
    let sentences = rm.generateSentences(2);
    let statement = sentences.join();
    statement = statement.replace('.,', '. ');
    currentStatement = statement;
    toSend = ['', statement];

    //TTS statement
    say.speak(statement, 'Alex');

    //save the tags used to generate this round
    pastTopics = tags;
    console.log(pastTopics);
  }

  return toSend;
}

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
