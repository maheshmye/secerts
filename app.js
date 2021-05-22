//jshint esversion:6
require("dotenv").config()
const express=require("express")
const bodyParser=require("body-parser")
const ejs=require("ejs")
const mongoose=require("mongoose")
const expresssession=require("express-session")
const passport=require("passport")
const passportlocalmongoose=require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate=require("mongoose-findorcreate")
//const mongoose_encrypt=require("mongoose-encryption")
//const md5=require("md5")
// const bcrypt=require("bcrypt")
// const saltRounds=10;


const usersecrets="tell you secret"
const app=express()
app.use(express.static("public"))
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}))

app.use(expresssession({
    secret:"wertyuiokjhgfdsaxcvbnbggfcfcdxdxsswaqwertyuyghngcxsergbnmkuyt",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())

// mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})
// mongoose.set("useCreateIndex",true)
//database
mongoose.connect("mongodb+srv://mahesh:mahesh@1999@cluster0.x3nnv.mongodb.net/secerets_db?retryWrites=true&w=majority",
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(() => {console.log("database connected")})


const userschema=new mongoose.Schema({
    email : { type: String, require: true, index:true, unique:true,sparse:true},
    password:String,
    googleId:String,
    secret:String
})

userschema.plugin(passportlocalmongoose)
userschema.plugin(findOrCreate)

// userschema.plugin(mongoose_encrypt, { secret: process.env.SECERTS,excludeFromEncryption:["email"] });

const usermodel=new mongoose.model("user",userschema)

passport.use(usermodel.createStrategy())

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    usermodel.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
function(accessToken, refreshToken, profile, cb) {
    usermodel.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/home",function(req,res){
    res.render("home")
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")

})



















app.get("/secrets",function(req,res){
     usermodel.find({secret:{$ne:null}},function(err,foundlist){
         if(err)
         console.log(err)
         else
         res.render("secrets",{usersecrets:foundlist})
     })
   
    
})

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
       res.render("submit")
    }
    else{
        res.render("login")
    }    
})
app.post("/submit",function(req,res){
    usermodel.findById(req.user.id,function(err,foundlist){   
        if(err)
        console.log(err)
        else
        {
            foundlist.secrets=req.body.secret
           foundlist.save(function(err){
            if(err)
            console.log(err)
            else
            {
        //    console.log(foundlist)
            //res.render("secrets",{usersecrets:foundlist.secret})
            res.redirect("/secrets")
            }
        })
    }
    })
    
})

































app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/home")
})

app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //     const newUser=new usermodel({
    //         email:req.body.username,
    //         password:hash
    //     })
    //     newUser.save(function(err){
    //         if(err)
    //         console.log(err)
    //         else
    //         res.render("secrets")
    //     })
    // })
    usermodel.register({username:req.body.username},req.body.password,function(err,newuser){
        if(err)
        {
            console.log(err)
            res.render("register")
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})
app.post("/login",function(req,res){
    // const mail=req.body.username
    // const password=req.body.password
    // console.log(mail)
    // console.log(password)
    //  usermodel.findOne({email:mail},function(err,foundlist){
    //     // console.log(foundlist)
    //     if(err)
    //     console.log(err)
    //     else
    //     {
    //         bcrypt.compare(password,foundlist.password,function(err,isequal){
    //             if(isequal===true)
    //             res.render("secrets")
    //             else
    //             console.log("password wrong")
    //         })
    //    } 
    // })
    const user1=new usermodel({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user1,function(err){
        if(err)
        {
            console.log(err)
            res.redirect("/login")
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})

// let port=process.env.PORT
// if(port==null ||port =="")
// {
//     port=3000;
// }





app.listen(3000,function(){
    console.log("setrver is running at port 3000")
})