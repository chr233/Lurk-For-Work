"use strict";

import { $http } from "./http_client.js";

class ApiUtil {
  constructor() {
    this.userNameDict = {};
  }

  checkToken() {
    return new Promise((resolve, reject) => {
      this.getUser(localStorage.getItem("userId")).then(([succ, data]) => {
        window.myInfo = succ ? data : {};

        const tasks = data.watcheeUserIds.map((id) => $api.getUser(id));

        if (tasks.length > 0) {
          Promise.all(tasks).then();
        }

        resolve(succ);
      });
    });
  }

  postAuthLogin(email, password) {
    return new Promise((resolve, reject) => {
      const data = { email, password };
      $http.post("/auth/login", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  postAuthRegister(name, email, password) {
    return new Promise((resolve, reject) => {
      const data = { name, email, password };
      $http.post("/auth/register", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  getJobFeed(start) {
    return new Promise((resolve, reject) => {
      $http.get(`/job/feed?start=${start}`).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  postJob(title, image, start, description) {
    return new Promise((resolve, reject) => {
      const data = { title, image, start, description };
      $http.post("/job", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  putJob(id, title, image, start, description) {
    return new Promise((resolve, reject) => {
      const data = { id, title, image, start, description };
      $http.put("/job", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  postJobComment(id, comment) {
    return new Promise((resolve, reject) => {
      const data = { id, comment };
      $http.post("/job/comment", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  putJobLike(id, isLike) {
    return new Promise((resolve, reject) => {
      const data = { id, turnon: isLike };
      $http.put("/job/like", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  deleteJob(id) {
    return new Promise((resolve, reject) => {
      const data = { id };
      $http.delete("/job", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  getUser(userId) {
    return new Promise((resolve, reject) => {
      $http.get(`/user?userId=${userId}`).then(([succ, data]) => {
        if (succ) {
          if (!this.userNameDict[data.id]) {
            this.userNameDict[data.id] = data.name;
          }
        }
        resolve([succ, data]);
      });
    });
  }

  putUser(name, email, password, image) {
    return new Promise((resolve, reject) => {
      const data = { name, email, password, image };
      $http.put("/user", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }

  putUserWatch(email, isWatch) {
    return new Promise((resolve, reject) => {
      const data = { email, turnon: isWatch };
      $http.put("/user/watch", data).then(([succ, data]) => {
        resolve([succ, data]);
      });
    });
  }
}

export const $api = new ApiUtil();
