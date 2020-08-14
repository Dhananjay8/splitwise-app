module.exports = (sequelize, type) => {
  return sequelize.define('user', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: type.STRING,
    last_name: type.STRING,
    user_name: {
      type: type.STRING,
      unique: true
    }
  },
    {underscored: true}
    )
};
