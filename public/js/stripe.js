/* eslint-disable */
const stripe = Stripe(
  'pk_test_51HhxnQDdNjL6JebiTxtQv620n83wa2RWvpk3idY27RqYamI6uKUz9sPmembr36RhP5ZTy8ImGS5GPRIQnWSQrs4e00IIGGJSBM'
);

const bookTour = async tourId => {
  try {
    // 1) Get the session from the server/API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create the checkout form + charge the credit card
    return stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    console.log(err);
  }
};

const bookBtn = document.getElementById('book-tour');

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'PROCESSING...';
    const { tourid } = e.target.dataset;
    bookTour(tourid);
  });
}
