// create the Express router
const express = require('express');
const router = express.Router();

const Sequelize = require('sequelize');

const enableGlobalErrorLogging = false;

const { check, validationResult } = require('express-validator');

//Body-parser
const bodyParser = require('body-parser');
router.use(bodyParser.json());

//load bcryptjs package to encrypt and decrypt password values
const bcrypt = require('bcryptjs');

//Sequelize DB object typical way to get Sequelize DB object
//router.set('models', require('../models'));

const User = require('../models').User;
const Course = require('../models').Course;
//USER ROUTES
//Send a GET request to /api/users to show users
//Returns HTTP: Status Code 200 means OK
router.get('/users', async(req, res) => {
    const userData = await User.findAll()
    //res.status(200);
    res.json(userData);
    //res.json(data);
});

//USER ROUTES
//Send a POST request to /api/users to create a user
//Returns HTTP: Status Code 201 means Created
//in the event of a validation error returns a 400 error means Bad Request
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
        const User = router.get('models').User;

        User.create(user)
            .then(() => {
                res.set('Location', "/");
                res.status(201);
                res.send();
            })
            .catch((err) => {
                next(new Error(err));
            });
    }
});

//COURSE ROUTES
//Send a GET request to /api/courses to list courses
//Returns HTTP: Status Code 200 means OK
router.get('/courses', (req, res) => {

    const Course = router.get('models').Course;
    const User = router.get('models').User;
    //get list of courses
    Course.findAll({
        order: [
            ['title', 'ASC'],
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
//Send a GET request to /api/courses/:id to show course
//Returns HTTP: Status Code 200 means OK  
router.get('/courses/:id', (req, res) => {
    const Course = router.get('models').Course;
    const User = router.get('models').User;
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
//Send a POST request to /api/courses to create courses
//Returns HTTP: Status Code 201 means Created
router.post('/courses', (req, res, next) => {
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
        //create the course
        //set HTTP header to the URI for the course
        const Course = router.get('models').Course;

        Course.create(course)
            .then((course) => {
                const fullUrl = req.protocol + '://' + req.get('host') + "/api/course/" + course.id;
                res.set('Location', fullUrl);
            })
            .then(() => {
                res.status(201);
                res.send();
            })
            .catch((err) => {
                next(new Error(err));
            });
    }
});

//COURSE ROUTES
//Send a PUT request to /api/courses/:id to update courses
//Returns HTTP: Status Code 204 means No Content

router.put('/courses/:id', (req, res) => {
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
        const Course = router.get('models').Course;

        //Update the course at ID :id

        //TODO: check if ID exists, exception if not

        Course.update(req.body,
            {
                where: { id: req.params.id }
            })
            .then(() => {
                res.status(204);
                res.send();
            })
            .catch((err) => {
                next(new Error(err));
            });
    }
});

//COURSE ROUTES
//Send a DELETE request to /api/courses/:id to delete courses
router.delete('/courses/:id', (req, res) => {
    //delete the course at ID :id - check if it exists first
    const Course = router.get('models').Course;


    Course.findByPk(req.params.id).then((foundCourse) => {
        if (foundCourse) {
            Course.destroy({
                where: { id: req.params.id }
            }).then(() => {
                res.status(204);
                res.send();
            })
                .catch((err) => {
                    next(new Error(err));
                });
        }
        else {
            res.status(404);
            res.json({ "message": "Course not found for ID " + req.params.id });
        }
    })
        .catch((err) => {
            next(new Error(err));
        });

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

// send 404 if no other route matched
router.use((req, res, next) => {
    res.status(404).json({
        message: 'Route Not Found',
    });
});

// setup a global error handler
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
