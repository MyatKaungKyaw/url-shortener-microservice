require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose=require('mongoose');
const app = express();
let original_url;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended:false}));

app.use(process.env.MONGO_URI,{useNewUrlParser : true, useUnifiedTopology : true});

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const logPath = (req,res,next) => {
  console.log('request path :',req.path);
  next();
}

const shortUrlSchema = new mongoose.Schema({
  originalUrl : String,
  shortUrl : Number,
});

const lastShortUrlSchema = new mongoose.Schema({
  shortUrl : Number,
});

const shortUrl = new mongoose.model('shortUrl',shortUrlSchema);
const lastShortUrl = new mongoose.model('lastShortUrl',lastShortUrlSchema);

//test insert
const insert = async (req,res) => {
  try{
    const google = new shortUrl({originalUrl : 'https://www.google.com/', shortUrl : 1});
    const lastUrl = new lastShortUrl({shortUrl : 1});
  }
  catch(err) {

  }
};
app.post('/api/insert',logPath,(req,res) => {
  
});

app.post('/api/shorturl',logPath,(req,res) => {
  const fullUrl = req.body.url;
  const url = validURL(fullUrl) ? {original_url : fullUrl, short_url : 1} :
                                  {error : 'invalid url'};
  
  urlHolder = url.hasOwnProperty('errot') ? '' : url;
  res.json(url);
});

app.get('/api/shorturl/:short_url',logPath,(req,res) => {
  if(req.params.short_url == urlHolder.short_url){
    res.redirect(urlHolder.original_url);
  }else{
    res.json({});
  }
}); 

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
