'use strict';
module.exports = (sequelize, DataTypes) => {
    const Course = sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,

        estimatedTime: {
            type: DataTypes.STRING,
            allowNull: true
        },

        materialsNeeded: {
            type: DataTypes.STRING,
            allowNull: true
        },


    }, {});

    //Relationship between the Courses and Users tables is defined (linking tables)
    Course.associate = function (models) {
        Course.belongsTo(models.User, {
            as: 'user',
            foreignKey: {
                fieldName: 'userId',
                allowNull: false,
            },
        }); //auto-generate userId in Course linking to User model
    };
    return Course;
};
