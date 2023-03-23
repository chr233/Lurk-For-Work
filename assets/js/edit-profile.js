(() => {
  "use strict";

  let objs = {};

  window.SPA_INIT = (args) => {
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const image = document.getElementById("image");
    const imageData = document.getElementById("image-data");
    const preview = document.getElementById("preview");

    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("You are not logged in");
      location.hash = "#login";
      return;
    }

    $api.getUser(userId).then(([succ, data]) => {
      name.value = data.name;
      email.value = data.email;
      imageData.value = data.image;
      preview.src = data.image;
    });

    document
      .getElementById("edit-profile")
      .addEventListener("submit", submitResult);
    image.addEventListener("change", updatePreview);

    objs = {
      name,
      email,
      password,
      image,
      imageData,
      preview,
    };
  };

  window.SPA_CHANGE = (args) => {
    console.log("hash change event");
  };

  function updatePreview(event) {
    const { image, imageData, preview } = objs;

    fileToDataUrl(image.files[0])
      .then((dataUrl) => {
        imageData.value = dataUrl;
        preview.src = dataUrl;
      })
      .catch((err) => {
        console.log(err);
        preview.src = "";
        image.value = null;
        imageData.value = null;
        alert("Image is not valid, only png, jpg and jpeg are allowed.");
      });
  }

  function submitResult(event) {
    event.preventDefault();

    const { name, email, password, imageData } = objs;

    if (!imageData.value) {
      alert("Please select a valid picture.");
    }

    if (email.value === myInfo.email) {
      $api
        .putUser(
          name.value,
          email.value,
          "test-" + password.value,
          imageData.value
        )
        .then(([succ, data]) => {
          if (!succ) {
            alert(data);
            return;
          }

          $api
            .putUser(name.value, email.value, password.value, imageData.value)
            .then(([succ, data]) => {
              if (!succ) {
                alert(data);
                return;
              }

              alert("Your profile saved successfully!");
              location.reload();
            });
        });
    } else {
      $api
        .putUser(name.value, email.value, password.value, imageData.value)
        .then(([succ, data]) => {
          if (!succ) {
            alert(data);
            return;
          }

          alert("Your profile saved successfully!");
          location.reload();
        });
    }
  }
})();
