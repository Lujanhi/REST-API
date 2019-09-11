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

    
    User.associate = function (models) {
        User.hasMany(models.Course); 
    };

    module.exports = User;
    return User;
}; 