//const Tour = require('../models/tourModel');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Exclude the items from the request parameter
    const queryObj = { ...this.queryString };

    const excludeItems = ['sort', 'fields', 'limit', 'page'];
    excludeItems.forEach(item => {
      delete queryObj[item];
    });

    // Applying the gte|lte|gt|lte|
    let queryStr = JSON.stringify(queryObj);
    const regex = /\b(gte|lte|gt|lt)\b/g;
    queryStr = queryStr.replace(regex, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // Query for sorting the response data
    if (this.queryString.sort) {
      const sortBy = JSON.stringify(this.queryString.sort)
        .split(',')
        .join(' ');
      this.query = this.query.sort(JSON.parse(sortBy));
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  paginate() {
    //query for pagination
    if (this.queryString.page) {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 2;

      // page 1, 1 - 10, page 2, 11 - 20, page 3, 21 - 30
      const skip = (page - 1) * limit;

      // const dataArrLength = await Tour.find({});
      // if (skip >= dataArrLength.length) {
      //   throw new Error('Data not found, please enter a valid page number.');
      // }

      this.query = this.query.skip(skip).limit(limit);
    }

    return this;
  }

  selectFields() {
    // Applying selected fields
    if (this.queryString.fields) {
      const selectByValues = this.queryString.fields;
      const fields = JSON.stringify(selectByValues)
        .split(',')
        .join(' ');
      this.query = this.query.select(JSON.parse(fields));
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
}

module.exports = APIFeatures;
