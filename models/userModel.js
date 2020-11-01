const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  //name, email, photo, password, passwordConfirm
  name: {
    type: String,
    required: [true, 'Please tell us yur name.'],
    trim: true,
    minlength: 8,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'An user must have an email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid Email.']
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'lead-guide', 'guide'],
    default: 'user'
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'The password you entered is not the same.'
    }
  },
  passwordChangedAt: Date,
  passwordResetExpires: Date,
  passwordResetToken: {
    type: String,
    default: undefined
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function(next) {
  // Find only the users with the active set to true
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = this.passwordChangedAt.getTime() / 1000 - 2000;
    return changedTimeStamp > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.createForgotPasswordResetToken = async function() {
  const resetToken = await crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = await crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // console.log(this.passwordResetToken, { resetToken });

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
