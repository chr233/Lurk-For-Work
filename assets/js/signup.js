(() => {
  "use strict";
  
  let objs = {};

  window.SPA_INIT = (args) => {
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const passwd = document.getElementById("passwd");
    const passwd2 = document.getElementById("passwd2");

    document.getElementById("signup-form").addEventListener("submit", signup);

    objs = { name, email, passwd, passwd2 };
  };

  window.SPA_CHANGE = (args) => {
    console.log("hash change event");
  };

  function signup(event) {
    event.preventDefault();

    const { name, email, passwd, passwd2 } = objs;

    if (passwd.value !== passwd2.value) {
      alert("your password is not the same");
      return;
    }

    $api
      .postAuthRegister(name.value, email.value, passwd.value)
      .then(([succ, data]) => {
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
