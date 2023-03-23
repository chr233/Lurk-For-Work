"use strict";

import { $page } from "./page_loader.js";

class Router {
  router(event) {
    if (event) {
      event.preventDefault();
      window.history.pushState({}, "", event.target.href);
    }
    $router.pageDispatcher(location.hash);
  }

  pageDispatcher(hash) {
    let [_, path, args] = hash.match(/#\/?([^/=]+)(?:=(\d+))?\/?/) ?? [
      null,
      null,
      null,
    ];

    if (!path) {
      location.hash = "feed";
      path = "feed";
    }

    if (!localStorage.getItem("token")) {
      if (path !== "login" && path !== "signup") {
        path = "login-tips";
        location.href = "#login";
      }
    } else {
      if (path === "login" || path === "signup" || path === "login-tips") {
        path = "feed";
        location.href = "#feed";
      }
    }

    document.title = `Lurk For Work - ${path}`;

    this.setNavibar();

    if (!avilablePages.has(path)) {
      path = "404";
    }

    if (args) {
      args = parseInt(args);
    }

    $page.getPage(path, "main", args);
  }

  setNavibar() {
    if (!localStorage.getItem("token")) {
      document
        .querySelectorAll("header>ul>li[none]")
        .forEach((ele) => ele.classList.remove("nav-hidden"));
      document
        .querySelectorAll("header>ul>li[auth]")
        .forEach((ele) => ele.classList.add("nav-hidden"));
    } else {
      document
        .querySelectorAll("header>ul>li[none]")
        .forEach((ele) => ele.classList.add("nav-hidden"));
      document
        .querySelectorAll("header>ul>li[auth]")
        .forEach((ele) => ele.classList.remove("nav-hidden"));

      const { id, name } = window.myInfo;
      const userName = document.getElementById("username");
      userName.textContent = `User: ${name}`;
      userName.href = `#profile=${id}`;
    }
  }
}

export const $router = new Router();

const avilablePages = new Set([
  "about",
  "edit-job",
  "edit-profile",
  "feed",
  "login",
  "login-tips",
  "profile",
  "signup",
]);
