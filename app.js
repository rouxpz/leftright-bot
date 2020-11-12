const express = require('express');
const say = require('say');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', {leftData:'', rightData:''});
});

app.post('/', (req, res) => {
  console.log(req.body.leftInput);
  console.log(req.body.rightInput);
  res.render('index', {leftData:req.body.leftInput, rightData:''});
  if (req.body.leftInput != '') {
    say.speak(req.body.leftInput, 'Alex');
  } else {
    say.speak("whoops no input", 'Alex');
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
