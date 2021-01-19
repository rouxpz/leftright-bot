let leftData = [];
let leftMetaData = [];

let rightData = [];
let rightMetaData = [];
let prevTopics = ['coronavirus'];

let sentenceStarts = ["Didn't you know that***?", "***", "You should be aware that***.", "You're wrong,***.", "The truth is that***.", "***", "Just admit that***!", "I want you to know that***.", "You will soon admit that***!", "***", "Why won't you just say that***?", "I'm telling you that***!", "Why can't I get you to believe that***?", "Actually,***.", "Well, I heard that***.", "That's idiotic, because***.", "I actually find that really upsetting because***.", "Oh,***.", "OK,***.", "I disagree,***.", "Look now,***."]

let globalMetadata = [];

let leftFiles = ['nick.json', 'nick-oped.json']
let rightFiles = ['kimberly.json', 'kimberly-oped.json']

let leftBox = document.getElementById('leftDia');
let rightBox = document.getElementById('rightDia');

function loadData() {
  for (var i = 0; i < leftFiles.length; i++) {
    $.getJSON("json/" + leftFiles[i], function(data) {
      $.each(data.data, function(key, val) {
        leftData.push(val.text);
        leftMetaData.push(val.metadata);
      });

      console.log("left data: " + leftData.length);
    });
  }

  for (var i = 0; i < rightFiles.length; i++) {
    $.getJSON("json/" + rightFiles[i], function(data) {
      $.each(data.data, function(key, val) {
        rightData.push(val.text);
        rightMetaData.push(val.metadata);
      });
      console.log("right data: " + rightData.length);
    });
  }

  $.getJSON("json/metadata.json", function(data) {
    $.each(data, function(key, val) {
      for (var i = 0; i < val.length; i++) {
        globalMetadata.push(val[i]);
      }
    });

    console.log("metadata: " + globalMetadata.length);
  });
}

function sendDialogue(side) {
  let userInput = document.getElementById(side+'Input').value;
  if (userInput != '') {
    if (side == 'left') {
      leftBox.innerHTML += "<strong>Me:</strong> " + userInput + '<br><br>';
      leftBox.scrollTop = leftBox.scrollHeight;
    } else {
      rightBox.innerHTML += "<strong>Me:</strong> " + userInput + '<br><br>';
      rightBox.scrollTop = rightBox.scrollHeight;
    }

    document.getElementById(side+'Input').value = '';
    generateResponse(userInput, side);

  } else {
    document.getElementById(side+'Input').value = '';
    generateResponse(userInput, side);
  }


}

function generateResponse(input, side) {

  let response;
  // let greetings = ['hello', 'hi'];
  let questionResponses = ["Why don't you tell me what you think instead of asking me?", "What do you mean?", "Can you tell me more?", "I'd like to hear what you think.", "Tell me what you mean by that."];

  input = input.toLowerCase();

  //add additional responses

  if (side == 'left') {
    if (input.indexOf('hello') != -1 || input.startsWith('hi') == true) {
      response = "Hi, I'm Nick. Nice to meet you."
    } else if (input.indexOf('nice to meet you') != -1) {
      response = "What would you like to talk about?"
    } else if (input.indexOf('how are you') != -1) {
      response = "Better now that Trump is out of office!"
    } else if (input.indexOf('trump') != -1) {
      response = "Ugh, don't mention that name around me!"
    } else if (input.indexOf("you're wrong") != -1) {
      response = "I'm stating facts. Where are you getting your information?"
    } else if (input.indexOf('?') != -1) {
      var index = Math.floor(Math.random() * questionResponses.length);
      response = questionResponses[index];
    } else {
      //send response
      response = generateMarkov(input, leftData, leftMetaData);
      // response = "Can you tell me more?"
    }
    setTimeout(function() {
      leftBox.innerHTML += "<strong>Nick:</strong> " + response + '<br><br>';
      leftBox.scrollTop = leftBox.scrollHeight;
    }, 500);

  } else {
    if (input.indexOf('hello') != -1 || input.startsWith('hi') == true) {
      response = 'Hello, my name is Kimberly. '
    } else if (input.indexOf('nice to meet you') != -1) {
      response = "What would you like to talk about?"
    } else if (input.indexOf('how are you') != -1) {
      response = "Not good. The radical left is going to destroy the country!"
    } else if (input.indexOf('biden') != -1) {
      response = "The election was stolen! Stop the steal!"
    } else if (input.indexOf("you're wrong") != -1) {
      response = "I think I'm right. You're brainwashed by the mainstream media."
    } else if (input.indexOf('?') != -1) {
      var index = Math.floor(Math.random() * questionResponses.length);
      response = questionResponses[index];
    } else {
      response = generateMarkov(input, rightData, rightMetaData);
      // response = "I'd like to hear more."
    }
    setTimeout(function() {
      rightBox.innerHTML += "<strong>Kimberly:</strong> " + response + '<br><br>';
      rightBox.scrollTop = rightBox.scrollHeight;
    }, 500);


  }
}

function generateMarkov(text, data, metadata) {

  let topics = [];
  let markov = RiTa.markov(5);

  //parse input for potential topics
  text = text.replace(/[.?!,]/g, '');
  text = text.toLowerCase();
  textTokens = text.split(' ');
  // console.log(inputTokens);

  for (var i = 0; i < textTokens.length; i++) {
    if (globalMetadata.includes(textTokens[i])) {
      if (!topics.includes(textTokens[i])) {
        topics.push(textTokens[i]);
      }
    }
  }
  // console.log(topics);
  if (topics.length <= 0) {
    console.log("no topics!");
    topics = prevTopics;
  }

  // console.log(topics);

  //select left texts
  for (var i = 0; i < metadata.length; i++) {
    for (var j = 0; j < topics.length; j++) {
      if (metadata[i].includes(topics[j])) {
        markov.addText(data[i]);
      }
    }
  }

  //generate markov
  generatedText = markov.generate(1);
  prevTopics = topics;
  // console.log(prevTopics);
  var index = Math.floor(Math.random() * sentenceStarts.length);
  console.log(sentenceStarts[index]);

  //make first letter of the markov toLowerCase
  //remove any punctuation at end

  // let toSend = sentenceStarts[index].replace('***', ' ' + generatedText[0]);
  let toSend = generatedText[0];
  toSend = toSend.replace("“", '').replace("”", '');

  return(toSend);
}

$("#leftInput").on('keypress', function(e) {
  if (e.keyCode == 13) {
    $('#leftButton').click();
  }
});

$("#rightInput").on('keypress', function(e) {
  if (e.keyCode == 13) {
    $('#rightButton').click();
  }
});
