(() => {
  "use strict";

  let objs = {};

  // init
  window.SPA_INIT = (args) => {
    const userEmail = document.getElementById("user-email");
    const userId = document.getElementById("user-id");
    const userProfile = document.getElementById("user-profile");

    document.getElementById("watch-user").addEventListener("submit", watchUser);
    document
      .getElementById("search-user")
      .addEventListener("submit", searchUser);

    objs = { userEmail, userId, userProfile };

    if (args) {
      userId.value = args;
      searchUser();
    }
  };

  // href change
  window.SPA_CHANGE = (args) => {
    const { userId } = objs;
    userId.value = args;
    searchUser();
  };

  function watchUser(event) {
    if (event) {
      event.preventDefault();
    }

    const { userEmail } = objs;

    $api.putUserWatch(userEmail.value, true).then(([succ, data]) => {
      if (succ) {
        alert("watch success");
        userEmail.value = "";
      } else {
        alert(data);
      }
    });
  }

  function searchUser(event) {
    if (event) {
      event.preventDefault();
    }

    const { userId, userProfile } = objs;

    location.hash = `#profile=${userId.value}`;

    $api.getUser(userId.value).then(([succ, data]) => {
      const element = window.$ele.genUserProfile(data);

      for (let x of userProfile.querySelectorAll("#user-profile>*")) {
        userProfile.removeChild(x);
      }
      userProfile.appendChild(element);

      if (succ) {
        objs.userProfile.classList.remove("nothing");
      } else {
        objs.userProfile.classList.add("nothing");
      }
    });
  }
})();
