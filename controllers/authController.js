const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const generateToken = async id => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = await generateToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  //const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetExpires: req.body.passwordResetExpires,
    passwordResetToken: req.body.passwordResetToken
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);

  // const token = await generateToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   user: newUser
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password exists
  if (!email || !password) {
    return next(
      new AppError('Please enter your email and password to login.', 400)
    );
  }

  // 2) check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  //const verifyPassword = User.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password!', 401));
  }

  // 3) If everything is ok then send token to the client
  createSendToken(user, 200, res);

  // const token = await generateToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.logout = async (req, res, next) => {
  res.cookie('jwt', 'Logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Please login to get access', 401));
  }

  // 2) Verification generateToken
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The User belonging to the token is no longer exists. Please login again.'
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  const changedPasswordAfter = currentUser.changedPasswordAfter(decoded.iat);
  if (changedPasswordAfter)
    return next(
      new AppError(
        'The user has changed the password, please login again.',
        401
      )
    );

  // Grant access to protected route
  req.user = currentUser;

  next();
});

// Any user has logged in or not / Will be used for all the routes
exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1) Getting token and check of its there
    if (req.cookies.jwt) {
      // 2) Verification generateToken
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issued
      const changedPasswordAfter = currentUser.changedPasswordAfter(
        decoded.iat
      );
      if (changedPasswordAfter) return next();

      // Grant access to protected route
      req.user = currentUser;
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You are not authorised to access this route. Please try another',
          403
        )
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Check if any email is provided or not
  if (!req.body.email) {
    return next(new AppError('Please enter an email ID', 401));
  }

  // 2) Fetch the user data acccording to the provided email
  const user = await User.findOne({ email: req.body.email });

  // 3) If no user found then send error to the client
  if (!user) {
    return next(new AppError('Please enter a valid email ID', 404));
  }

  // 4) Generate a reset token and save it to the database
  const resetToken = await user.createForgotPasswordResetToken();
  user.save({ validateBeforeSave: false });

  // 5) Send it to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token(valid for 10 min)',
    //   message
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    // console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending this email. Please try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const encryptedToken = await crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: encryptedToken
  }).select('+password');
  // console.log(user);

  // 2) If the token has not expired and there is user,  set the new password
  if (!user || !user.passwordResetExpires > Date.now()) {
    return next(
      new AppError('Token is not valid or expired, Please try again.', 401)
    );
  }

  // if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
  //   return next(
  //     new AppError(
  //       'Your current password is wrong. Please provide a correct password',
  //       403
  //     )
  //   );
  // }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // 3) Update changedPasswordAt property for the users
  user.passwordChangedAt = Date.now();
  await user.save({ validateBeforeSave: true });

  // 4) Log the user in, send the token to the user
  createSendToken(user, 200, res);

  // const token = await generateToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted current password is correctPassword
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError(
        'Current password is incorrect, please provide the correct password',
        401
      )
    );
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now();
  await user.save({ validateBeforeSave: true });

  // 4) Log user in send the Token
  createSendToken(user, 200, res);

  // const token = await generateToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});
