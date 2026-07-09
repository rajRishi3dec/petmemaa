document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const signinForm = document.getElementById('signin-form');
  const boardingForm = document.getElementById('boarding-form');

  // Function to update due date based on given date
  function updateDueDate(givenDateId, dueDateId) {
    const givenDateElement = document.getElementById(givenDateId);
    const dueDateElement = document.getElementById(dueDateId);

    givenDateElement.addEventListener('change', function () {
      const givenDate = new Date(this.value);
      if (!isNaN(givenDate)) {
        const dueDate = new Date(givenDate);
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        dueDate.setDate(dueDate.getDate() - 1);
        dueDateElement.value = dueDate.toISOString().split('T')[0];
      } else {
        dueDateElement.value = '';
      }
    });
  }

  // Call updateDueDate for each vaccination type
  updateDueDate('anti_rabies_given_date', 'anti_rabies_due_date');
  updateDueDate('nine_in_one_given_date', 'nine_in_one_due_date');
  updateDueDate('canine_corona_given_date', 'canine_corona_due_date');
  updateDueDate('kennel_cough_given_date', 'kennel_cough_due_date');
  updateDueDate('deworming_given_date', 'deworming_due_date');

  // Signup form submission handler
  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Prevent default form submission

      const username = document.getElementById('username').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      // Client-side validation
      if (!username || !phone || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
      }

      if (!phone.match(/^\d{10}$/)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
      }

      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }

      // Send signup request
      try {
        const response = await fetch('/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, phone, password, confirmPassword }),
        });

        if (response.ok) {
          alert('Signup successful');
          window.location.href = '/signin'; // Redirect to signin page after successful signup
        } else {
          const error = await response.text();
          alert(`Signup failed: ${error}`);
        }
      } catch (error) {
        console.error('Error during signup:', error);
        alert('Signup failed. Please try again later.');
      }
    });
  }

  // Signin form submission handler
  if (signinForm) {
    signinForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Prevent default form submission

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // Client-side validation
      if (!username || !password) {
        alert('Please enter username and password.');
        return;
      }

      // Send signin request
      try {
        const response = await fetch('/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          alert('Signin successful');
          window.location.href = '/welcome'; // Redirect to welcome page after successful signin
        } else {
          const error = await response.text();
          alert(`Signin failed: ${error}`);
        }
      } catch (error) {
        console.error('Error during signin:', error);
        alert('Signin failed. Please try again later.');
      }
    });
  }

  // Boarding form submission handler
  if (boardingForm) {
    boardingForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Prevent default form submission

      // IMPORTANT: send multipart/form-data (FormData) so multer can receive uploaded files.
      const fd = new FormData(boardingForm);

      try {
        const response = await fetch('/boarding', {
          method: 'POST',
          body: fd, // no Content-Type header; browser sets it with boundary
        });

        if (response.ok) {
          alert('Congratulations, your form has been submitted successfully');
          window.location.href = '/welcome'; // Redirect to welcome page after successful submission
        } else {
          const error = await response.text();
          alert(`Form submission failed: ${error}`);
        }
      } catch (error) {
        console.error('Error during form submission:', error);
        alert('Form submission failed. Please try again later.');
      }
    });
  }
});