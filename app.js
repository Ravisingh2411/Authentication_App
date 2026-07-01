const express = require('express');
const app = express();
const userModel = require("./models/user");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');
const path = require('path');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get("/", function(req, res){
    res.render("home");
})

app.get("/register", function(req, res){
    res.render("index");
})

app.post("/create", (req, res) => {
    let{username, email, password, age} = req.body;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                username,
                email, 
                password: hash,
                age
            })

            let token = jwt.sign({email}, "sshhshhshhhh");
            res.cookie("token", token);
            // res.send(createdUser);
            res.redirect("/dashboard");
            })
        }) 
})

app.get("/login", function(req, res){
    res.render("login");
})

function isLoggedIn(req, res, next) {
    let token = req.cookies.token;
    if (!token) {
        return res.redirect("/login");
    }
    try {
        let data = jwt.verify(token, "sshhshhshhhh");
        req.user = data;
        next();
    }
    catch(err){
        return res.redirect("/login");
    }
}

app.post("/delete-account", isLoggedIn, async function(req, res) {
    await userModel.findOneAndDelete({
        email: req.user.email
    });
    res.clearCookie("token");
    res.redirect("/");
});

app.get("/dashboard", isLoggedIn, async function(req,res){
    let user = await userModel.findOne({
        email: req.user.email
    });
    res.render("dashboard",{user});

});

app.post("/login", async function(req, res) {
    let user = await userModel.findOne({ email: req.body.email });
    if (!user) {
        return res.render("loginFailed");
    }
    bcrypt.compare(req.body.password, user.password, function(err, result) {
        if (result) {
            let token = jwt.sign(
                { email: user.email },
                "sshhshhshhhh"
            );
            res.cookie("token", token);
            res.redirect("/dashboard");
        } else {
            res.render("loginFailed");
        }
    });
});

app.get("/logout", function(req, res){
    res.cookie("token", "");
    res.redirect("/");
})

app.listen(3000);