/* eslint-disable */

// DOM elements
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// type is either 'data' or 'password'
const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'Password'
        ? 'http://127.0.0.1:8000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:8000/api/v1/users/updateMe';

    const result = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (result.data.status === 'success') {
      showAlert('success', `${type} Updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// For updating the user name or email
if (userDataForm) {
  userDataForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.save-data-button').textContent = 'UPDATING...';
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // await updateSettings({ name, email }, 'data');

    await updateSettings(form, 'Data');
    document.querySelector('.save-data-button').textContent = 'SAVE SETTINGS';
    location.reload(true);
  });
}

// For updating the user password
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.save-password-button').textContent = 'UPDATING...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'Password'
    );
    document.querySelector('.save-password-button').textContent =
      'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
