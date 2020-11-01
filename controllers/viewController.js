const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template
  // 3) Render that template using tour data from step 1)

  res.status(200).render('overview', {
    title: 'All Tour',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //   1) Get the data for the requested tour(included reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) return next(new AppError('No tour found with this name', 404));
  //   2) Build template for
  //   3) Render template using the data from 1)

  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all the bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIds = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login to your account'
  });
};

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findOne(req.user);
  res.status(200).render('myAccount', {
    title: 'My account',
    user
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedResult = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('myAccount', {
    title: 'My Account',
    user: updatedResult
  });
});
