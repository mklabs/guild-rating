const express = require('express');
const got = require('got');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const app = express();
const { apikey } = require('./config');

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PVP_ID = 21;
const RATED_ARENAS_ID = 152;
const HIGHEST_2V2_ID = 370;
const HIGHEST_3V3_ID = 595;
const HIGHEST_RBG_ID = 596;

const statRequest = ({ region, server}) => async ({ character }) => {
  try {
    const url = `https://${region}.api.battle.net/wow/character/${encodeURIComponent(server)}/${encodeURIComponent(character.name)}?fields=statistics&locale=en_US&apikey=${apikey}`;
    // console.log('Making char request', url);
    const { body } = await got(url, { json: true });
    const pvp = body.statistics.subCategories.find(cat => cat.id === PVP_ID);
    const ratedArenas = pvp.subCategories.find(cat => cat.id === RATED_ARENAS_ID);
    const highest2v2 = ratedArenas.statistics.find(cat => cat.id === HIGHEST_2V2_ID).quantity;
    const highest3v3 = ratedArenas.statistics.find(cat => cat.id === HIGHEST_3V3_ID).quantity;
    const highestRbg = ratedArenas.statistics.find(cat => cat.id === HIGHEST_RBG_ID).quantity;

    return {
      name: character.name,
      img: `https://render-${region}.worldofwarcraft.com/icons/18/class_${body.class}.jpg`,
      highest2v2,
      highest3v3,
      highestRbg
    };
  } catch (err) {
    // ignore errors for now
    return {
      name: character.name,
      highest2v2: 'error loading rating',
      highest3v3: 'error loading rating',
      highestRbg: 'error loading rating'
    };
  }
};

app.get('/', async (req, res, next) => {
  res.render('index', { members: [], homepage: true });
});

app.get('/check', upload.array(), async (req, res, next) => {
  const { region, server, guild } = req.query;
  console.log('Checking', region, server, guild);

  const url = `https://${region}.api.battle.net/wow/guild/${encodeURIComponent(server)}/${encodeURIComponent(guild)}?fields=members&locale=en_US&apikey=${apikey}`;
  console.log('URL', url);

  try {
    const { body } = await got(url, { json: true });

    let { members } = body;
    console.log('Making request for %d members:', members.length, region, server, guild);
    members = await Promise.all(members.map(statRequest({ region, server })));
    members = members.filter(member => member.highest2v2 !== 'error loading rating');
    res.render('index', { members });
  } catch (err) {
    console.error('ERR', region, server, guild, err);
    if (err.statusCode === 404) {
      return res.render('error', { err: `Guild "${guild}" not found on ${server} server, ${region.toUpperCase()} region.` });
    }

    res.render('error', { err });
  }
});

app.listen(3000, () => console.log('Listening on 3000'));
