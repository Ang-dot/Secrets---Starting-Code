require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/userDB", (err) => {

    if(!err) {

        console.log("Connected to userDB successfully!")

    } else {

        console.log(err);

    }
})

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

app.route("/")
    .get((req, res) => {

        res.render("home");
        
    })

app.route("/login")
    .get((req, res) => {

        res.render("login");
        
    })
    .post((req, res) => {

        const email = req.body.email;
        const password = req.body.password;

        User.findOne({email: email}, (err, targetUser) => {

            if(!err) {

                if(targetUser) {

                    if(targetUser.password === password) {

                        console.log("The user has logged in successfully!");
                        res.render("secrets");

                    }

                    else {

                        console.log("The user has entered the wrong password.")
                        res.redirect("/login");

                    }
                } else {

                    console.log("No account found.")
                    res.redirect("/");

                }
            } else {

                console.log(err);

            }
        })
    })

app.route("/register")
    .get((req, res) => {

        res.render("register");
        
    })
    .post((req, res) => {

        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });

        newUser.save((err) => {

            if (!err) {

                console.log("New user has been registered successfully!");
                res.render("secrets");

            } else {

                console.log(err);

            }
        })
    })

app.listen(process.env.PORT || 3000, () => {

    console.log("The server has been started.");

})