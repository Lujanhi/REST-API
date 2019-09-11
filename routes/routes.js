const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const enableGlobalErrorLogging = false;
const { check, validationResult } = require('express-validator');
const auth = require('basic-auth');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const bcrypt = require('bcryptjs');

const User = require('../models').User;
const Course = require('../models').Course;

//User authentication middleware
const authenticateUser = async (req, res, next) => {
    let message;
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
    if (credentials) {
        //Find user with matching email address
        const user = await User.findOne({
            raw: true,
            where: {
                emailAddress: credentials.name,
            },
        });
        //If user matches email
        if (user) {
            // Use the bcryptjs npm package to compare the user's password
            // (from the Authorization header) to the user's password
            // that was retrieved from the data store.
            const authenticated = bcrypt.compareSync(credentials.pass, user.password);
            //If password matches
            if (authenticated) {
                console.log(`Authentication successful for user: ${user.firstName} ${user.lastName}`);
                if (req.originalUrl.includes('courses')) {
                    //If route has a courses endpoint, set request userId to matched user id
                    req.body.userId = user.id;
                } else if (req.originalUrl.includes('users')) {
                    //If route has a users endpoint, set request id to matched user id
                    req.body.id = user.id;
                }
            } else {
                //Otherwise the Authentication failed
                message = `Authentication failed for user: ${user.firstName} ${user.lastName}`;
            }
        } else {
            // No email matching the Authorization header
            message = `User not found for email address: ${credentials.name}`;
        }
    } else {
        //No user credentials/authorization header available
        message = 'Authorization header not found';
    }
    // Deny Access if there is anything stored in message
    if (message) {
        console.warn(message);
        const err = new Error('Access Denied');
        err.status = 401;
        next(err);
    } else {
        //User authenticated
        next();
    }
}

//USER ROUTES
// GET request to /api/users 
//Returns HTTP: Status Code 200 means 
router.get('/users', authenticateUser, async (req, res) => {
    const userData = await User.findByPk(req.body.id,)
    res.json(userData);
});

//USER ROUTES
//POST request to /api/users ---- create a user
//Returns HTTP--- Status Code 201 

//if validation is wrong then returns a 400 error  ---- Bad Request


router.post('/users', (req, res, next) => {
    const user = req.body;

    const errors = [];

    if (!user.firstName) {
        errors.push('Please provide a value for "firstName"');
    }
    if (!user.lastName) {
        errors.push('Please provide a value for "lastName"');
    }
    if (!user.emailAddress) {
        errors.push('Please provide a value for "emailAddress"');
    }
    if (!user.password) {
        errors.push('Please provide a value for "password"');
    }

    if (errors.length != 0) {
        res.status(400);
        res.json(errors);
    }
    else {
        user.password = bcrypt.hashSync(user.password, 8);
        const User = require('../models').User;

        User.create(user)
            .then(() => {
                res.set('Location', "/");
                res.status(201);
                res.send();
            })
            .catch((err) => {
                if (err.name === "SequelizeUniqueConstraintError") {
                    res.json(err.errors)
                } else { next(new Error(err)); }


            });
    }
});

//COURSE ROUTES
// GET request to /api/courses to list courses
//Returns HTTP---- Status Code 200 
router.get('/courses', (req, res) => {

    const Course = require('../models').Course;
    const User = require('../models').User;
    
    
    //get list of courses
    Course.findAll({
        order: [
            ['id', 'ASC'],
        ],
        include: [
            { model: User, as: 'user' }
        ]
    })
        .then((courseList) => {
            res.status(200);
            res.json(courseList);
        });
});

//COURSE ROUTES
//GET request to /api/courses/:id to show course
//Returns HTTP--- Status Code 200 
router.get('/courses/:id', (req, res) => {
    const Course = require('../models').Course;
    const User = require('../models').User;
    Course.findByPk(req.params.id, {
        include: [
            { model: User, as: 'user' }
        ]
    }
    ).then((foundCourse) => {
        if (foundCourse) {
            res.status(200);
            res.json(foundCourse);
        }
        else {
            //Render 404 if the book at :id is not in the database
            res.status(404);
            res.json({ "message": "Course not found for ID " + req.params.id });
        }
    })
        .catch((err) => {
            next(new Error(err));
        });


});

//COURSE ROUTES
// POST request to /api/courses to create courses
//Returns HTTP----- Status Code 201 
router.post('/courses', authenticateUser, async (req, res, next) => {
    try {

        const course = req.body;

        const errors = [];

        if (!course.title) {
            errors.push('Please provide a value for "title"');
        }
        if (!course.description) {
            errors.push('Please provide a value for "description"');
        }

        if (errors.length != 0) {
            res.status(400);
            res.json(errors);
        }
        else {
            

            const newCourse = await Course.create(course)
            res.location(`/api/courses/${newCourse.id}`)
            res.status(201).end()
        }
    } catch (err) {
        console.log("500 internal server error")
        next(err)
    }


});

//COURSE ROUTES
// PUT request to /api/courses/:id to update courses
//Returns HTTP---- Status Code 204 

router.put('/courses/:id', authenticateUser, async (req, res, next) => {
    const course = req.body;

    const errors = [];

    if (!course.title) {
        errors.push('Please provide a value for "title"');
    }
    if (!course.description) {
        errors.push('Please provide a value for "description"');
    }

    if (errors.length != 0) {
        res.status(400);
        res.json(errors);
    }
    else {

        await Course.update(req.body,
            {
                where: { id: req.params.id }
            })
            .then(() => {
                res.status(204);
                res.send();
            })
            .catch(err)
        console.log("500 internal server error")
        next(err)
    }
});

//COURSE ROUTES
// DELETE request to /api/courses/:id to delete courses
router.delete('/courses/:id', authenticateUser, async (req, res, next) => {
    //delete the course at ID ---- id, check if it exists first

    try {
        const deleteCourse = await Course.findByPk(req.params.id)

        if (deleteCourse.userId === req.body.userId) {
            await deleteCourse.destroy()
            res.status(204).end()
        } else {
            res.status(403);
            res.json({ "message": "forbidden you dont have permission" });
        }
    } catch (err) {
        console.log("500 internal server error")
        next(err)
    }



});

// setup a friendly greeting for the root route
router.get('/', (req, res) => {
    const sql = new Sequelize({
        dialect: 'sqlite',
        storage: 'fsjstd-restapi.db'
    });

    const test = sql.authenticate()
        .then(function () {
            console.log("CONNECTED! ");
        })
        .catch(function (err) {
            console.log("FAILED");
        })
        .done();
    res.json({
        message: 'Welcome to the REST API project!',
    });
});

// send 404 if other route do not match
router.use((req, res, next) => {
    res.status(404).json({
        message: 'Route Not Found',
    });
});

// global error handler
router.use((err, req, res, next) => {
    if (enableGlobalErrorLogging) {
        console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
    }

    res.status(err.status || 500).json({
        message: err.message,
        error: {}
    });
});

module.exports = router;
