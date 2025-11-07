document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form");

  // ✅ Handle form submission
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    fetch("sendmail.php", {
      method: "POST",
      body: new FormData(form)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert("✅ Message sent successfully! We’ll get back to you soon.");
        form.reset();
      } else {
        alert("⚠️ Something went wrong while sending. Please try again later.");
      }
    })
    .catch(() => {
      alert("⚠️ Network error — please try again later.");
    });
  });
});
