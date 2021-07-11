import { Router, static as Static } from 'express';
import session from 'express-session';
import passport from 'passport';
import passportDiscord from 'passport-discord';
import passportOAuth2Refresh from 'passport-oauth2-refresh';
import { join } from 'path';

import { client, config } from '../index';
import routes from './routes';

const api = Router();

const discordStrategy = new passportDiscord.Strategy(
  {
    clientID: client.user!.id,
    clientSecret: config.SECRET,
    callbackURL: config.WEBSITE + config.CALLBACK,
    scope: 'identify guilds'
  },
  (accessToken, refreshToken, profile, done) => {
    // User logged in
    profile.refreshToken = refreshToken;
    profile.accessToken = accessToken;
    process.nextTick(() => {
      return done(null, profile);
    });
  }
);

passport.use(discordStrategy);

passportOAuth2Refresh.use(discordStrategy);

api.use(
  session({
    secret: config.COOKIESECRET,
    resave: false,
    saveUninitialized: false
  })
);

api.use(passport.initialize());

api.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

api.get(
  config.CALLBACK,
  passport.authenticate('discord', {
    failureRedirect: '/'
  }),
  function (req, res) {
    res.redirect('/dashboard');
  }
);

passport.deserializeUser((obj: Express.User, done) => {
  done(null, obj);
});

api.use('/', Static(join(__dirname, '../../assets')));

api.use('/', routes);

// 404 Error Handling at the End
api.all('*', (req, res) => {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.sendFile(join(__dirname, '../../views/404.html'));
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.json({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

export default api;

export { passportOAuth2Refresh };
