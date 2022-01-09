exports.user_signup_data_check = (req, res, next) => {
  const { name, email, password } = req.body;

  errors = [];

  if (!name || name.length < 2) {
    errors.push("Kinldly specify name of user (minimum of 2 characters)");
  }

  if (
    !email ||
    !email.match(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/)
  ) {
    errors.push("Kinldly specify a valid email of user");
  }

  if (!password || password.length < 8) {
    errors.push("Kinldly specify password (minimum of 8 characters)");
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: errors,
    });
  } else {
    next();
  }
};

exports.user_login_data_check = (req, res, next) => {
  const { email, password } = req.body;

  errors = [];

  if (
    !email ||
    !email.match(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/)
  ) {
    errors.push("Kinldly specify a valid email of user");
  }

  if (!password || password.length < 8) {
    errors.push("Kinldly specify password (minimum of 5 characters)");
  }

  if (errors.length > 0) {
    res.status(400).json({
      message: errors,
    });
  } else {
    next();
  }
};
