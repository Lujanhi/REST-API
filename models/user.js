 'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        emailAddress: DataTypes.STRING,
        password: DataTypes.STRING
    }, {});

    //Relationship between the Users and Courses tables is defined (linking tables)
    User.associate = function (models) {
        User.hasMany(models.Course); //grants access to user.getCourses()
    };

    module.exports = User;
    return User;
}; 