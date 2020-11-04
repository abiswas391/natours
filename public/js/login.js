/* eslint-disable */
// DOM Element
const loginForm = document.querySelector('.form-login');
const logoutButton = document.querySelector('.nav__el--logout');

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
    window.setTimeout(hideAlert, 5000);
    // alert(err.response.data.message);
  }
};

// Event listener for the submission of login form
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // console.log(email, password);
    login(email, password);
  });
}

// type is 'success' or 'error'
const showAlert = (type, msg) => {
  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout'
    });
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logout, Please try again!!');
  }
};

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    logout();
  });
}
