require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { response } = require('express');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended:false}));

mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true});

// Schema
const shortUrlSchema = new mongoose.Schema({
  originalUrl : String,
  shortUrl : Number,
});

const lastShortUrlSchema = new mongoose.Schema({
  shortUrl : Number,
});

const shortUrl = mongoose.model('shortUrl',shortUrlSchema);
const lastShortUrl = mongoose.model('lastShortUrl',lastShortUrlSchema);

// CRUD functions
async function insertShortUrl(url){
  try{
    const docLastShortUrl = await lastShortUrl.findById(process.env.LAST_SHORT_URL_ID).exec();
    const lastUrl = await shortUrl.findOne({shortUrl: docLastShortUrl.shortUrl}).exec();
    const docUrl = new shortUrl({originalUrl:url, shortUrl:lastUrl.shortUrl+1});
    const newUrl = await docUrl.save();
    const updateLastShortUrl = await lastShortUrl.findByIdAndUpdate(
        process.env.LAST_SHORT_URL_ID,
        {shortUrl : newUrl.shortUrl},
        {new: true}
      );
    return newUrl;
  }catch(err){
    console.error(`insertShortUrl Err : ${err}`)
  }
}

async function checkUrlAlreadyShroten(url){
  const docShortUrl = await shortUrl.findOne({originalUrl: url}).exec();
  // console.log(`docShortUrl : ${docShortUrl}`);
  return docShortUrl;
}

// checkUrlAlreadyShroten('https://www.google.com');

async function findWithShort_url(short_url){
  try{
    const foundUrl = await shortUrl.findOne({shortUrl: short_url}).exec();
    // console.log(`foundUrl : ${foundUrl}`);
    return foundUrl;
  }catch(err){
    console.err(`findWithShort_url Err : ${err}`);
  }
}


// Your first API endpoint
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const logPath = (req,res,next) => {
  console.log('request path :',req.path);
  next();
}

app.post('/api/shorturl',logPath,async (req,res) => {
  try{
    const fullUrl = req.body.url;
    let url;

    if(validURL(fullUrl)){
      const alreadyExistedUrl = await checkUrlAlreadyShroten(fullUrl);
      const returnedUrl = alreadyExistedUrl == null ? await insertShortUrl(fullUrl) : alreadyExistedUrl;
      url = {original_url:returnedUrl.originalUrl, short_url:returnedUrl.shortUrl};
    }else{
      url = {error : 'invalid url'};
    }
    res.json(url);
  }catch(err){
    console.error(`Path /api/shorturl Err : ${err}`);
  }
}); 

app.get('/api/shorturl/:short_url',logPath,async (req,res) => {
  try{
    const short_url = req.params.short_url;
    
    if(isNaN(short_url)){
      response.json({error:'Wrong format'});
      return;
    }

    const docShortUrl = await findWithShort_url(short_url);
    console.log(`docShortUrl : ${docShortUrl}`);
    if(docShortUrl == null){
      res.json({error : 'No short URL found for the given input'});
    }else{
      res.redirect(docShortUrl.originalUrl);
    }
  }catch(err){
    console.error(`Path /api/shorturl/:short_url Err : ${err}`);
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
