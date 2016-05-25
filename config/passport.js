// config/passport.js
var fs = require('fs');
// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var bcrypt   = require('bcrypt-nodejs');

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

var mysql = require('mysql');

var connection = mysql.createConnection
   ({
     host     : 'testdbinstance.cdpx0mgjgscn.us-east-1.rds.amazonaws.com',
     user     : 'test',
     password : 'xxx',
     database : 'mydatabase'
   }); 

// expose this function to our app using module.exports
module.exports = function(passport) {
console.log("connection.....");
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query("select * from signup where id = "+id,function(err,rows){   
            done(err, rows[0]);
        });
    });
    

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        connection.query("select * from signup where email = '"+email+"'",function(err,rows){
            console.log(rows);
            console.log("above row object");
            if (err)
                return done(err);
             if (rows.length) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUserMysql = new Object();
                newUserMysql.fname    = req.body.fname;
                newUserMysql.lname    = req.body.lname;
                newUserMysql.email    = email;
                newUserMysql.password = password;// use the generateHash function in our user model
                var insertQuery = "INSERT INTO signup ( fname, lname, email, password ) values ('" + newUserMysql.fname +"','" + newUserMysql.lname +"','" + newUserMysql.email +"','"+ newUserMysql.password +"')";
                connection.query(insertQuery,function(err,rows){
                newUserMysql.id = rows.insertId;
                console.log(newUserMysql);
                return done(null, newUserMysql);
                }); 
            }   
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

         connection.query("SELECT * FROM signup WHERE `email` = '" + email + "'",function(err,rows){
            if (err)
                return done(err);
             if (!rows.length) {
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            } 
            console.log(rows[0]);
            if (password==(rows[0].password))
                 return done(null, rows[0]);
             else
               return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
        });
        
    }));

};


