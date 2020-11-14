const express = require('express');
const say = require('say');
const fs = require('fs');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const rita = require('rita');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));

//automate back and forth discussion between bots
//allow user to interrupt and change subject
//sort content by metadata (look for more content)

let leftFile = fs.readFileSync('left_test.json');
let rightFile = fs.readFileSync('right_test.json');

let rightData = JSON.parse(rightFile);
let leftData = JSON.parse(leftFile);

let rightCorpus = '';
let leftCorpus = '';

let currentTopic = 'election';

let toggle = false;

// for (var i = 0; i < rightData.length; i++) {
//   rightCorpus += rightData[i].text;
// }
//
// for (var i = 0; i < leftData.length; i++) {
//   leftCorpus += leftData[i].text;
// }


app.get('/', (req, res) => {
  // setTimeout(myFunc, 1500, 'funky');
  res.render('index', {leftData:'', rightData:''});
});

app.post('/', (req, res) => {
  let side;
  // let topics = [];

  //determine side
  if (toggle == false) {
    side = "right";
    toggle = true;
  } else {
    side = "left";
    toggle = false;
  }

  //parse current fragment for topics, either from last thing said or from user input
  // console.log(currentTopics);

  let dataToUse = generateConvo(side, currentTopic);
  // console.log(dataToUse);

  // console.log(rightDia);
  res.render('index', {leftData:dataToUse[1], rightData:dataToUse[0]});

})

function generateConvo(s, t) {

  let toSend = [];
  let rm = rita.RiMarkov(3);
  console.log(t);

  if (s == "right") {
    rightCorpus = '';
    for (var i = 0; i < rightData.length; i++) {
      if (rightData[i].metadata.includes(t) == true) {
        // toAdd.push(rightData[i].text);
        rightCorpus += rightData[i].text;
      }
    }
    // console.log(toAdd);
    rm.loadText(rightCorpus);
    let sentences = rm.generateSentences(2);
    let statement = sentences.join();
    statement = statement.replace('.,', '. ');
    currentStatement = statement;
    toSend = [statement, ''];

  } else if (s == "left") {
    leftCorpus = '';
    for (var i = 0; i < leftData.length; i++) {
      if (leftData[i].metadata.includes(t) == true) {
        // toAdd.push(rightData[i].text);
        leftCorpus += leftData[i].text;
      }
    }
    rm.loadText(leftCorpus);
    let sentences = rm.generateSentences(2);
    let statement = sentences.join();
    statement = statement.replace('.,', '. ');
    currentStatement = statement;
    toSend = ['', statement];
  }

  return toSend;
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
