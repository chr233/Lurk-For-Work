(() => {
  "use strict";
  
  let objs = {};

  window.SPA_INIT = (args) => {
    const email = document.getElementById("email");
    const passwd = document.getElementById("passwd");

    document.getElementById("login-form").addEventListener("submit", login);

    objs = { email, passwd };
  };

  window.SPA_CHANGE = (args) => {
    console.log("hash change event");
  };

  function login(event) {
    event.preventDefault();

    const { email, passwd } = objs;

    $api.postAuthLogin(email.value, passwd.value).then(([succ, data]) => {
      if (succ) {
        const { token, userId } = data;
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        $router.setNavibar();

        $api.getUser(userId).then(([succ, data]) => {
          window.myInfo = succ ? data : {};

          const name = window.myInfo.name ?? "ERROR";

          alert(`Welcome back ${name}`);

          location.hash = "#feed";
        });
      } else {
        alert(data);
      }
    });
  }
})();
