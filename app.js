require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({

    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false

}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", (err) => {

    if(!err) {

        console.log("Connected to userDB successfully!");

    } else {

        console.log(err);

    }
})


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    linkedInId: String,
    secrets: []
});
 

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user.id);
});


passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    })
});


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_KEY,
    clientSecret: process.env.LINKEDIN_SECRET,
    callbackURL: "http://localhost:3000/auth/linkedin/secrets",
    scope: ["r_liteprofile"],
    state: false
  }, (accessToken, refreshToken, profile, cb) => {
    console.log(profile);
    User.findOrCreate({ linkedInId: profile.id }, function (err, user) {
    return cb(null, user);
    });
  }));


app.get("/", (req, res) => {
        res.render("home");
    });


app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] })
);


app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });


app.get("/auth/linkedin", 
  passport.authenticate("linkedin", { state: "SOME STATE" })
);


app.get("/auth/linkedin/secrets", 
passport.authenticate("linkedin", { 
    successRedirect: '/secrets',
    failureRedirect: '/login'
}));


app.route("/login")
    .get((req, res) => {

        res.render("login");
        
    })
    .post((req, res) => {

        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, (err) => {

            if (!err) {

                passport.authenticate("local")(req, res, () => {

                    res.redirect("secrets");

                });

            } else {

                console.log(err);

            }

        })

    });


app.get("/secrets", (req, res) => {

    if (req.isAuthenticated()) {

        res.render("secrets");

    } else {

        res.redirect("/login");

    }
});


app.route("/submit")
    .get((req, res) => {

        if (req.isAuthenticated()) {

            res.render("submit");

        } else {

            res.redirect("/login");

        }
    })
    .post((req, res) => {

        User.findByIdAndUpdate(req.user.id, 

    })


app.route("/register")
    .get((req, res) => {

        res.render("register");
        
    })
    .post((req, res) => {

        User.register({ username: req.body.username }, req.body.password, (err, user) => {

            if(!err){

                passport.authenticate("local")(req, res, () => {

                    res.redirect("/secrets");

                })

            } else {

                console.log(err);
                res.redirect("/register");

            }

        })

    });


app.get("/logout", (req, res) => {

    req.logout();
    res.redirect("/");

});


app.listen(process.env.PORT || 3000, () => {

    console.log("The server has been started.");

});