class PullService {
  constructor() {
    this.jobCommentDict = {};
    this.userIdJobData = {};
    this.msgCount = 0;
    this.noticeCountEle = document.getElementById("notice-count");
    this.noticesEle = document.getElementById("notifications");
  }

  init() {
    const t1 = setInterval(() => {
      this.checkMyJobs(false).then((succ) => {
        if (succ) {
          clearInterval(t1);
          console.log("init pull service 1");
          setInterval(() => this.checkMyJobs(true), 3000);
        }
      });
    }, 1000);

    const t2 = setInterval(() => {
      this.checkOthersJobs(false).then((succ) => {
        if (succ) {
          clearInterval(t2);
          console.log("init pull service 2");
          setInterval(() => this.checkOthersJobs(true), 3000);
        }
      });
    }, 1000);

    setInterval(() => {
      $api.getUser(localStorage.getItem("userId")).then(([succ, data]) => {
        if(succ){
          window.myInfo=data;
        }
      });
    }, 10000);
  }

  checkMyJobs(enable) {
    return new Promise((resolve, reject) => {
      if (!myInfo.id) {
        resolve(false);
      }
      $api.getUser(myInfo.id).then(([succ, data]) => {
        if (succ) {
          console.log("check my jobs");

          for (let job of data.jobs) {
            if (this.jobCommentDict[job.id]) {
              const oldCount = this.jobCommentDict[job.id]?.length ?? -1;
              const newCount = job.comments?.length ?? -1;

              if (newCount > -1 && oldCount > -1 && oldCount !== newCount) {
                if (enable) {
                  for (let x = oldCount; x < newCount; x++) {
                    if (job.comments[x].userId !== myInfo.id) {
                      this.newCommentMessage(job, job.comments[x]);
                    }
                  }
                }
              }
            }
            this.jobCommentDict[job.id] = job.comments;
          }
        } else {
          console.error("check my jobs", data);
        }
        resolve(succ);
      });
    });
  }

  checkOthersJobs(enable) {
    return new Promise((resolve, reject) => {
      if (!myInfo.id) {
        resolve(false);
      }

      const tasks = myInfo.watcheeUserIds.map((id) => $api.getUser(id));

      if (tasks.length > 0) {
        Promise.all(tasks).then((datas) => {
          for (let [succ, data] of datas) {
            if (succ) {
              console.log("check others jobs");

              if (this.userIdJobData[data.id]) {
                const oldCount = this.userIdJobData[data.id]?.length ?? -1;
                const newCount = data.jobs?.length ?? -1;

                if (newCount > -1 && oldCount > -1 && oldCount < newCount) {
                  if (enable) {
                    for (let x = oldCount; x < newCount; x++) {
                      this.newJobMessage(data, data.jobs[x]);
                    }
                  }
                }
              }

              this.userIdJobData[data.id] = data.jobs;
            } else {
              console.error("check others jobs", data);
            }
          }
        });
      }

      resolve(true);
    });
  }

  newCommentMessage(job, comment) {
    console.log("new comment message", job, comment);
    this.addNotice(
      `${comment.userName} left a comment on job ${job.title} [${job.id}]`,
      `#profile=${job.creatorId}`
    );
  }

  newJobMessage(user, job) {
    console.log("new job message", user, job);
    this.addNotice(
      `${user.name} just published a new job ${job.title} [${job.id}]`,
      `#profile=${job.creatorId}`
    );
  }

  addNotice(text, href) {
    const li = $ele.genLi();
    const a = $ele.genA(text, href, null, text);
    li.appendChild(a);
    this.noticesEle.appendChild(li);
    this.msgCount++;
    this.updateMessageCount();
  }

  clearNotice() {
    const msgs = this.noticesEle.querySelectorAll("li:not([id])");
    for (let msg of msgs) {
      this.noticesEle.removeChild(msg);
    }
    this.msgCount = 0;
    this.updateMessageCount();
    alert("All notifications cleared");
  }

  updateMessageCount() {
    if (this.msgCount > 0) {
      this.noticeCountEle.textContent = `Notifications(${this.msgCount})`;
    } else {
      this.noticeCountEle.textContent = "Notifications";
    }
  }
}

export const $pull = new PullService();
