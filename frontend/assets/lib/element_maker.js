class ElementMaker {
  updateElementHtml(ele, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const newEle = document.createElement(ele.nodeName);
    newEle.id = ele.id;
    newEle.className = ele.className;

    for (let x of doc.body.children) {
      newEle.appendChild(x);
    }

    ele.parentNode?.replaceChild(newEle, ele);
    return newEle;
  }

  updateElement(parent, content) {
    const newEle = document.createElement(parent.nodeName);
    newEle.id = parent.id;
    newEle.className = parent.className;

    newEle.appendChild(content);

    parent.parentNode?.replaceChild(newEle, parent);
    return newEle;
  }

  genUl(cls) {
    const ul = document.createElement("ul");
    if (cls) {
      ul.className = cls;
    }
    return ul;
  }

  genLi(cls) {
    const li = document.createElement("li");
    if (cls) {
      li.className = cls;
    }
    return li;
  }

  genDiv(cls) {
    const div = document.createElement("div");
    if (cls) {
      div.className = cls;
    }
    return div;
  }

  genImage(src) {
    const img = document.createElement("img");
    img.className = "job-img";
    img.src = src;
    return img;
  }

  genP(cls) {
    const p = document.createElement("p");
    if (cls) {
      p.className = cls;
    }
    return p;
  }

  genSpan(text, cls) {
    const span = document.createElement("span");
    span.textContent = text;
    if (cls) {
      span.className = cls;
    }
    return span;
  }

  genButton(text, cls, foo) {
    const btn = document.createElement("button");
    btn.textContent = text;
    if (cls) {
      btn.className = cls;
    }
    if (foo) {
      btn.addEventListener("click", foo);
    }
    return btn;
  }

  genA(text, href, cls, title) {
    const a = document.createElement("a");
    a.textContent = text;
    a.href = href;
    if (cls) {
      a.className = cls;
    }
    if (title) {
      a.title = title;
    }
    return a;
  }

  genHr() {
    const hr = document.createElement("hr");
    return hr;
  }

  genInput(type, cls, placeholder) {
    const input = document.createElement("input");
    input.type = type;
    if (cls) {
      input.className = cls;
    }
    if (placeholder) {
      input.placeholder = placeholder;
    }
    return input;
  }

  genJobItem(data) {
    const {
      image,
      title,
      description,
      createdAt,
      creatorId,
      id,
      start,
      likes,
      comments,
    } = data;

    const li = this.genLi("job-item");
    li.appendChild(this.genImage(image));

    const pId = this.genP("job-rt");
    pId.appendChild(this.genSpan("Id", "job-title"));
    pId.appendChild(this.genSpan(id, `#feed=${id}`, "job-id"));
    if (creatorId === myInfo.id) {
      pId.appendChild(
        this.genButton("Edit", "job-btn-edit", () => {
          window.jobInfo = data;
          location.hash = "edit-job";
        })
      );
      pId.appendChild(
        this.genButton("Delete", "job-btn-delete", () => {
          if (!confirm("Are you sure to delete this job?")) {
            return;
          }

          $api.deleteJob(id).then(([succ, data]) => {
            if (succ) {
              li.parentElement.removeChild(li);
            } else {
              alert(data);
            }
          });
        })
      );
    }
    li.appendChild(pId);

    const pTitle = this.genP();
    pTitle.appendChild(this.genSpan("Title", "job-title"));
    pTitle.appendChild(this.genSpan(title, "job-text"));
    li.appendChild(pTitle);

    const pDesc = this.genP();
    pDesc.appendChild(this.genSpan("Description", "job-title"));
    pDesc.appendChild(this.genSpan(description, "job-text"));
    li.appendChild(pDesc);

    const pStart = this.genP();
    pStart.appendChild(this.genSpan("Start At", "job-title"));
    pStart.appendChild(this.genSpan(this.friendlyDate(start), "job-text"));
    li.appendChild(pStart);

    const pCreate = this.genP();
    pCreate.appendChild(this.genSpan("Created At", "job-title"));
    pCreate.appendChild(this.genSpan(this.friendlyDate(createdAt), "job-text"));
    li.appendChild(pCreate);

    const pCreator = this.genP();
    pCreator.appendChild(this.genSpan("Creator", "job-title"));
    const userName = $api.userNameDict[creatorId] ?? "Unknown";

    pCreator.appendChild(
      this.genA(
        `${userName} [${creatorId}]`,
        `#profile=${creatorId}`,
        "job-id",
        "View details"
      )
    );
    li.appendChild(pCreator);

    let isLiked = false;
    if (likes) {
      const myId = myInfo.id;
      for (let { userId } of likes) {
        if (userId === myId) {
          isLiked = true;
          break;
        }
      }
    }
    let likeCount = likes?.length ?? 0;

    const pLike = this.genP();
    pLike.appendChild(this.genSpan("Likes", "job-title"));
    pLike.appendChild(this.genSpan(likeCount, "job-text"));
    pLike.appendChild(
      this.genButton(isLiked ? "Unlike" : "Like", "job-btn", () => {
        isLiked = !isLiked;
        $api.putJobLike(id, isLiked).then(([succ, data]) => {
          if (succ) {
            likeCount += isLiked ? 1 : -1;
            pLike.children[1].textContent = likeCount;
            pLike.children[2].textContent = isLiked ? "Unlike" : "Like";
          } else {
            alert(data);
            isLiked = !isLiked;
          }
        });
      })
    );
    li.appendChild(pLike);

    const pCommentList = this.genP("expand");

    const pComment = this.genP();
    pComment.appendChild(this.genSpan("Comments", "job-title"));
    pComment.appendChild(this.genSpan(comments?.length ?? "0", "job-text"));
    pComment.appendChild(
      this.genButton("Expand", "job-btn", () => {
        if (pCommentList.classList.contains("active")) {
          pCommentList.classList.remove("active");
          pComment.children[2].textContent = "Expand";
        } else {
          pCommentList.classList.add("active");
          pComment.children[2].textContent = "Collapse";
        }
      })
    );
    li.appendChild(pComment);

    const ulCommentList = this.genUl("job-list");

    for (let { userId, userEmail, userName, comment } of comments) {
      const pCommentItem = this.genLi("job-item");
      const p1 = this.genP("job-title");
      const link = this.genA("", `#profile=${userId}`, "job-id", userEmail);
      link.appendChild(this.genSpan(userName, "job-text"));
      link.appendChild(this.genSpan(" ", "job-text"));
      link.appendChild(this.genSpan(userEmail, "job-text"));
      p1.appendChild(link);
      pCommentItem.appendChild(p1);
      const p2 = this.genP("job-text");
      p2.appendChild(this.genSpan(comment));
      pCommentItem.appendChild(p2);
      ulCommentList.appendChild(pCommentItem);
    }

    pCommentList.appendChild(ulCommentList);

    const pTxtComment = this.genP("job-send-comment");
    const txtComment = this.genInput(
      "text",
      "job-input-comment",
      "Left your Comment"
    );
    pTxtComment.appendChild(txtComment);

    pTxtComment.appendChild(
      this.genButton("Send", "job-btn-comment", () => {
        const comment = txtComment.value;
        if (comment) {
          $api.postJobComment(id, comment).then(([succ, data]) => {
            if (succ) {
              txtComment.value = "";

              const { id, email, name } = window.myInfo;

              const pCommentItem = this.genLi("job-item");
              const p1 = this.genP("job-title");
              const link = this.genA("", `#profile=${id}`, "job-id", email);
              link.appendChild(this.genSpan(name, "job-text"));
              link.appendChild(this.genSpan(" ", "job-text"));
              link.appendChild(this.genSpan(email, "job-text"));
              p1.appendChild(link);
              pCommentItem.appendChild(p1);
              const p2 = this.genP("job-text");
              p2.appendChild(this.genSpan(comment));
              pCommentItem.appendChild(p2);
              ulCommentList.appendChild(pCommentItem);
            } else {
              alert(data);
            }
          });
        } else {
          alert("Please input your comment");
          txtComment.focus();
        }
      })
    );

    pCommentList.appendChild(pTxtComment);
    li.appendChild(pCommentList);

    return li;
  }

  genUserProfile(userInfo) {
    const { email, id, jobs, name, watcheeUserIds } = userInfo;

    if (!id) {
      return this.genSpan(userInfo);
    } else {
      const div = this.genDiv();

      const pId = this.genP();
      pId.appendChild(this.genSpan("Id", "job-title"));
      pId.appendChild(this.genSpan(id, "job-text"));
      div.appendChild(pId);

      const pName = this.genP();
      pName.appendChild(this.genSpan("Name", "job-title"));
      pName.appendChild(this.genSpan(name, "job-text"));

      if (id === myInfo.id) {
        pName.appendChild(
          this.genButton("Edit my profile", "job-btn", () => {
            location.hash = "edit-profile";
          })
        );
      }

      div.appendChild(pName);

      const pEmail = this.genP();
      pEmail.appendChild(this.genSpan("Email", "job-title"));
      pEmail.appendChild(this.genSpan(email, "job-text"));
      div.appendChild(pEmail);

      let isWatching = false;
      if (watcheeUserIds) {
        const myId = myInfo.id;
        for (let uid of watcheeUserIds) {
          if (uid === myId) {
            isWatching = true;
            break;
          }
        }
      }
      let watchCount = watcheeUserIds?.length ?? 0;

      const pFollow = this.genP();
      pFollow.appendChild(this.genSpan("Watchee", "job-title"));
      pFollow.appendChild(this.genSpan(watchCount, "job-text"));
      pFollow.appendChild(
        this.genButton(isWatching ? "Unwatch" : "Watch", "profile-btn", () => {
          isWatching = !isWatching;
          $api.putUserWatch(email, isWatching).then(([succ, data]) => {
            if (succ) {
              watchCount += isWatching ? 1 : -1;
              pFollow.children[1].textContent = watchCount;
              pFollow.children[2].textContent = isWatching
                ? "Unwatch"
                : "Watch";
            } else {
              alert(data);
            }
          });
        })
      );
      div.appendChild(pFollow);

      div.appendChild(this.genHr());

      const pJob = this.genP();
      pJob.appendChild(this.genSpan("Jobs List", "job-title"));

      const jobUl = this.genUl("job-list");
      for (let job of jobs) {
        const li = this.genJobItem(job);
        jobUl.appendChild(li);
      }
      pJob.appendChild(jobUl);
      div.appendChild(pJob);

      // const pComment = this.genP();
      // pComment.appendChild(this.genSpan("Comments:", "job-title"));
      // pComment.appendChild(this.genSpan(comments?.length ?? "0", "job-text"));
      // pComment.appendChild(
      //   this.genButton("Comment", "job-btn", () => alert(12345))
      // );
      // div.appendChild(pComment);

      return div;
    }
  }

  friendlyDate(dateStr) {
    const now = new Date();
    const targetDate = new Date(dateStr);
    let totalSeconds = ((now - targetDate) / 1000) | 0;

    let suffix = "ago";
    if (totalSeconds < 0) {
      suffix = "later";
      totalSeconds = -totalSeconds;
    }

    if (totalSeconds < 86400) {
      totalSeconds %= 86400;
      const hours = (totalSeconds / 3600) | 0;
      totalSeconds %= 3600;
      const minutes = (totalSeconds / 60) | 0;
      return `${hours} hours ${minutes} minutes ${suffix}`;
    } else {
      const day = targetDate.getDate();
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
}

export const $ele = new ElementMaker();
