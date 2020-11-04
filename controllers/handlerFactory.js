const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc || doc.length === 0) {
      const error = new AppError('No document found with this ID', 404);
      return next(error);
    }

    res.status(204).json({
      data: {
        status: 'success',
        data: null
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc || doc.length === 0) {
      const error = new AppError('No document found with this ID', 404);
      return next(error);
    }

    res.status(202).json({
      data: {
        status: 'success',
        data: {
          data: doc
        }
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    // console.log(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc || doc.length === 0) {
      const error = new AppError('No document found with this ID', 404);
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    let filter = {};

    // IN case the route is similar to "Get all reviews on tour"
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // In case the route is similar to "Get all bookings on user"
    if (req.params.userId) filter = { user: req.params.userId };
    // console.log('Hello from the get all function');
    // console.log(req.params);

    // Executing query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .paginate()
      .selectFields();
    const doc = await features.query;

    // Sending response back
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
