"use strict";

import { $router } from "./lib/router.js";
import { $http } from "./lib/http_client.js";
import { $api } from "./lib/api_util.js";
import { $ele } from "./lib/element_maker.js";
import { fileToDataUrl } from "./lib/helpers.js";

// define global vars
window.$router = $router;
window.$http = $http;
window.$api = $api;
window.$ele = $ele;
window.fileToDataUrl = fileToDataUrl;
window.myInfo = {};
window.jobInfo = null;

window.addEventListener("hashchange", $router.router);
window.addEventListener("load", $router.router);

$api.checkToken().then((succ) => {
  if (succ) {
    const { name, id } = window.myInfo;
    console.log("login as", name, id);
  } else {
    console.log("not login");
  }
  console.log("login state:", succ);
  $router.setNavibar();
});

document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  $router.setNavibar();
  location.hash = "#login";
});
